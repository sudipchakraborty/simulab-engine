import {avrProfile,type AvrChip} from './avrProfiles.js';
import {
  CPU,
  avrInstruction,
  AVRIOPort,
  AVRTimer,
  AVRUSART,
  PinState,
  AVRTWI,
} from "avr8js";
import { parseIntelHex } from "./hex.js";
import { isRecognizedOpcode } from "./opcodes.js";
import {
  RuntimeError,
  UNO_CLOCK_HZ,
  type DigitalLevel,
  type RuntimeSnapshot,
  type RuntimeState,
  type GpioTransition,
} from "./types.js";
/** @brief Inject an external I2C bus. Empty write probes an address; reads use the device register pointer. */
export interface UnoOptions { onBeforeInputRead?:(timeMicros:number,gpio:Record<string,DigitalLevel>)=>void; onGpioTransition?:(event:GpioTransition,gpio:Record<string,DigitalLevel>)=>void; i2c?: {write(address:number,bytes:number[]):boolean;read(address:number,count:number):number[]} }
/** @brief Real AVR CPU adapter, free from UI and host scheduling. Host supplies bounded cycle slices.
 * @param hex Compiled Intel HEX for the explicitly selected chip. The adapter never parses Arduino source functions.
 */
export interface AvrOptions extends UnoOptions {mcu?:AvrChip}
export class AvrRuntime {
  private readonly profile:ReturnType<typeof avrProfile>;
  private readonly flash: Uint8Array;
  private cpu!: CPU;
  private ports!: Record<string, AVRIOPort>;
  private state: RuntimeState = "ready";
  private serial = "";
  private transitions: GpioTransition[] = [];
  private levels: Record<string, DigitalLevel> = {};
  private uart!: AVRUSART;
  private rxQueue:number[]=[];
  constructor(hex: string, private readonly options:AvrOptions = {}) {
    this.profile=avrProfile(options.mcu);
    this.flash = parseIntelHex(hex,this.profile.flashBytes);
    this.initialize();
  }
  private initialize(): void {
    const words = new Uint16Array(this.profile.flashBytes/2);
    for (let i = 0; i < words.length; i++)
      words[i] = this.flash[i * 2] | (this.flash[i * 2 + 1] << 8);
    this.cpu = new CPU(words, this.profile.sramAllocation);
    this.ports=Object.fromEntries(Object.entries(this.profile.ports).map(([name,cfg])=>[name,new AVRIOPort(this.cpu,cfg)]));
    // Resolve delayed external devices at the actual PIN-register read, not only at output edges.
    for(const port of Object.values(this.ports)) {
      const addr=port.portConfig.PIN;
      this.cpu.readHooks[addr]=()=>{this.options.onBeforeInputRead?.(this.cpu.cycles/16,this.readLevels());return this.cpu.data[addr];};
    }
    for(const cfg of this.profile.timers)new AVRTimer(this.cpu,cfg);
    const uart = new AVRUSART(this.cpu, this.profile.uart, UNO_CLOCK_HZ);
    this.uart=uart;this.rxQueue=[];
    const twi=new AVRTWI(this.cpu,this.profile.twi,UNO_CLOCK_HZ);
    let address=0,bytes:number[]=[];
    const syncBus=()=>this.options.onBeforeInputRead?.(this.cpu.cycles/16,this.readLevels());
    twi.eventHandler={
      start:()=>{bytes=[];twi.completeStart();},
      stop:()=>{bytes=[];twi.completeStop();},
      connectToSlave:(addr)=>{syncBus();address=addr;bytes=[];twi.completeConnect(this.options.i2c?.write(addr,[])??false);},
      writeByte:(value)=>{syncBus();bytes.push(value);twi.completeWrite(this.options.i2c?.write(address,bytes)??false);},
      readByte:()=>{syncBus();twi.completeRead(this.options.i2c?.read(address,1)[0]??255);},
    };
    uart.onByteTransmit = (byte: number) => {
      if (this.serial.length >= 4096)
        throw new RuntimeError(
          "OUTPUT_LIMIT",
          "UART output exceeds 4096-byte batch limit.",
        );
      this.serial += String.fromCharCode(byte);
    };
    this.serial = "";
    this.transitions = [];
    this.levels = this.readLevels();
    for (const port of Object.values(this.ports))
      port.addListener(() => this.captureTransitions());
    this.state = "ready";
  }
  private readLevels(): Record<string, DigitalLevel> {
    const result: Record<string, DigitalLevel> = {};
    for (const [pin, [port, bit]] of Object.entries(this.profile.pins)) {
      const state = this.ports[port].pinState(bit);
      result[pin] =
        state === PinState.High ? 1 : state === PinState.Low ? 0 : null;
    }
    return result;
  }
  private captureTransitions(): void {
    const now = this.readLevels();
    const pending:GpioTransition[]=[];
    for (const pin of Object.keys(now)) {
      if (now[pin] !== this.levels[pin]) {
        if (this.transitions.length >= 4096)
          throw new RuntimeError(
            "OUTPUT_LIMIT",
            "GPIO output exceeds 4096-transition batch limit.",
          );
        const event={ pin, level: now[pin], cycle: this.cpu.cycles };
        this.transitions.push(event);pending.push(event);
      }
    }
    this.levels = now;
    for(const event of pending)this.options.onGpioTransition?.(event,now);
  }
  /** @brief Begin a loaded CPU; restarting a stopped CPU initializes fresh power-on state. */
  start(): void {
    if (this.state !== "ready" && this.state !== "stopped")
      throw new RuntimeError(
        "INVALID_STATE",
        "Start requires a ready or stopped runtime.",
      );
    if (this.state === "stopped") this.initialize();
    this.state = "running";
  }
  pause(): void {
    if (this.state !== "running")
      throw new RuntimeError(
        "INVALID_STATE",
        "Pause requires a running runtime.",
      );
    this.state = "paused";
  }
  resume(): void {
    if (this.state !== "paused")
      throw new RuntimeError(
        "INVALID_STATE",
        "Resume requires a paused runtime.",
      );
    this.state = "running";
  }
  stop(): void {
    this.state = "stopped";
  }
  /** @brief Restore original flash, zero cycles and fresh AVR peripherals. */
  reset(): void {
    this.initialize();
  }
  /** @brief Apply an external digital input, including interrupt-enabled pins. Output pins remain MCU-driven. */
  setPin(pin: string, value: boolean): void {
    if (typeof value !== "boolean" || !Object.hasOwn(this.profile.pins, pin))
      throw new RuntimeError(
        "INVALID_INPUT",
        "Expected a Uno digital pin and boolean input.",
      );
    const [port, bit] = this.profile.pins[pin];
    this.ports[port].setPin(bit, value);
  }
  /** @brief Apply a resolved external digital level. Floating inputs use the AVR pull-up state (otherwise deterministic LOW).
   * @details This fallback does not establish a physically valid floating voltage; the circuit host reports ambiguity.
   */
  setPinLevel(pin:string,level:DigitalLevel):void {
    if(!this.profile.pins[pin])throw new RuntimeError('INVALID_PIN','Unknown AVR pin');
    const [port,bit]=this.profile.pins[pin];
    this.setPin(pin,level===null?this.ports[port].pinState(bit)===PinState.InputPullUp:level===1);
  }
  /** @brief Execute real instructions until cycle budget is reached; one instruction can cross the boundary. */
  runCycles(budget: number): RuntimeSnapshot {
    if (this.state !== "running")
      throw new RuntimeError(
        "INVALID_STATE",
        "CPU must be running to execute cycles.",
      );
    if (!Number.isSafeInteger(budget) || budget < 1 || budget > 250000)
      throw new RuntimeError(
        "INVALID_BUDGET",
        "Cycle budget must be an integer from 1 to 250000.",
      );
    const end = this.cpu.cycles + budget;
    try {
      while (this.cpu.cycles < end) {
        const opcode = this.cpu.progMem[this.cpu.pc];
        if (!isRecognizedOpcode(opcode))
          throw new RuntimeError(
            "UNSUPPORTED_OPCODE",
            `Unsupported AVR opcode 0x${opcode?.toString(16)} at byte ${this.cpu.pc * 2}.`,
          );
        if ([0x9588, 0x95e8, 0x95f8, 0x95a8, 0x9598].includes(opcode))
          throw new RuntimeError(
            "UNSUPPORTED_OPERATION",
            "Sleep, self-programming, watchdog and debug-break operations are unsupported.",
          );
        avrInstruction(this.cpu);
        this.cpu.tick();
        if(this.rxQueue.length&&this.uart.rxEnable&&!this.uart.rxBusy) {
          if(this.uart.writeByte(this.rxQueue[0]))this.rxQueue.shift();
        }
      }
    } catch (error) {
      this.state = "stopped";
      if (error instanceof RuntimeError) throw error;
      throw new RuntimeError(
        "EXECUTION_ERROR",
        error instanceof Error ? error.message : "AVR execution failed.",
      );
    }
    return this.snapshot();
  }
  /** @brief Queue bounded external UART bytes for the real AVR USART peripheral. */
  uartInput(bytes:Uint8Array):void {
    if(!(bytes instanceof Uint8Array)||this.rxQueue.length+bytes.length>4096)throw new RuntimeError('INPUT_LIMIT','UART input exceeds 4096 bytes');
    this.rxQueue.push(...bytes);
  }
  /** @brief Inspect real CPU registers. PC is a byte address; no source mapping is implied. */
  debugSnapshot() {return {pcBytes:this.cpu.pc*2,sp:this.cpu.dataView.getUint16(0x5d,true),sreg:this.cpu.data[0x5f],registers:Array.from(this.cpu.data.slice(0,32))};}
  /** @brief Execute exactly one real instruction from ready/paused state. */
  stepInstruction() {
    if(!['ready','paused'].includes(this.state))throw new RuntimeError('INVALID_STATE','Pause before stepping');
    this.state='running';const s=this.runCycles(1);this.state='paused';s.state='paused';return s;
  }
  /** @brief Read current cycle-derived state, draining bounded event and UART batches. */
  snapshot(): RuntimeSnapshot {
    const result: RuntimeSnapshot = {
      cycles: this.cpu.cycles,
      timeMicros: this.cpu.cycles / (UNO_CLOCK_HZ / 1e6),
      state: this.state,
      gpio: this.readLevels(),
      serial: this.serial,
      transitions: this.transitions,
    };
    this.serial = "";
    this.transitions = [];
    return result;
  }
}

/** @brief Backward-compatible explicit ATmega328P runtime; Mega uses AvrRuntime with its own profile. */
export class UnoRuntime extends AvrRuntime {constructor(hex:string,options:UnoOptions={}){super(hex,{...options,mcu:"atmega328p"});}}
