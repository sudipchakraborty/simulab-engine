import {CPU,avrInstruction,AVRIOPort,AVRTimer,AVRUSART,PinState,portBConfig,portCConfig,portDConfig,timer0Config,timer1Config,timer2Config,usart0Config} from 'avr8js';
import {parseIntelHex} from './hex.js';
import {isRecognizedOpcode} from './opcodes.js';
import {RuntimeError,UNO_CLOCK_HZ,type DigitalLevel,type RuntimeSnapshot,type RuntimeState,type GpioTransition} from './types.js';
const PIN_MAP:Readonly<Record<string,readonly [string,number]>>=Object.freeze(Object.fromEntries([
 ...Array.from({length:8},(_,i)=>[`D${i}`,['D',i]]),...Array.from({length:6},(_,i)=>[`D${i+8}`,['B',i]]),...Array.from({length:6},(_,i)=>[`A${i}`,['C',i]])
])) as Record<string,readonly [string,number]>;
/** @brief Real AVR CPU adapter, free from UI and host scheduling. Host supplies bounded cycle slices.
 * @param hex Compiled ATmega328P Intel HEX. The adapter never parses Arduino source functions.
 */
export class UnoRuntime {
 private readonly flash:Uint8Array;
 private cpu!:CPU;
 private ports!:Record<string,AVRIOPort>;
 private state:RuntimeState='ready';
 private serial='';
 private transitions:GpioTransition[]=[];
 private levels:Record<string,DigitalLevel>={};
 constructor(hex:string){this.flash=parseIntelHex(hex);this.initialize();}
 private initialize():void {
  const words=new Uint16Array(16384);for(let i=0;i<words.length;i++)words[i]=this.flash[i*2]|this.flash[i*2+1]<<8;
  this.cpu=new CPU(words,2048);
  this.ports={B:new AVRIOPort(this.cpu,portBConfig),C:new AVRIOPort(this.cpu,portCConfig),D:new AVRIOPort(this.cpu,portDConfig)};
  new AVRTimer(this.cpu,timer0Config);new AVRTimer(this.cpu,timer1Config);new AVRTimer(this.cpu,timer2Config);
  const uart=new AVRUSART(this.cpu,usart0Config,UNO_CLOCK_HZ);
  uart.onByteTransmit=(byte:number)=>{if(this.serial.length>=4096)throw new RuntimeError('OUTPUT_LIMIT','UART output exceeds 4096-byte batch limit.');this.serial+=String.fromCharCode(byte);};
  this.serial='';this.transitions=[];this.levels=this.readLevels();
  for(const port of Object.values(this.ports))port.addListener(()=>this.captureTransitions());
  this.state='ready';
 }
 private readLevels():Record<string,DigitalLevel> {
  const result:Record<string,DigitalLevel>={};for(const [pin,[port,bit]] of Object.entries(PIN_MAP)){const state=this.ports[port].pinState(bit);result[pin]=state===PinState.High?1:state===PinState.Low?0:null;}return result;
 }
 private captureTransitions():void {
  const now=this.readLevels();for(const pin of Object.keys(now)){if(now[pin]!==this.levels[pin]){if(this.transitions.length>=4096)throw new RuntimeError('OUTPUT_LIMIT','GPIO output exceeds 4096-transition batch limit.');this.transitions.push({pin,level:now[pin],cycle:this.cpu.cycles});}}
  this.levels=now;
 }
 /** @brief Begin a loaded CPU; restarting a stopped CPU initializes fresh power-on state. */
 start():void {if(this.state!=='ready'&&this.state!=='stopped')throw new RuntimeError('INVALID_STATE','Start requires a ready or stopped runtime.');if(this.state==='stopped')this.initialize();this.state='running';}
 pause():void {if(this.state!=='running')throw new RuntimeError('INVALID_STATE','Pause requires a running runtime.');this.state='paused';}
 resume():void {if(this.state!=='paused')throw new RuntimeError('INVALID_STATE','Resume requires a paused runtime.');this.state='running';}
 stop():void {this.state='stopped';}
 /** @brief Restore original flash, zero cycles and fresh AVR peripherals. */
 reset():void {this.initialize();}
 /** @brief Apply an external digital input, including interrupt-enabled pins. Output pins remain MCU-driven. */
 setPin(pin:string,value:boolean):void {if(typeof value!=='boolean'||!Object.hasOwn(PIN_MAP,pin))throw new RuntimeError('INVALID_INPUT','Expected a Uno digital pin and boolean input.');const [port,bit]=PIN_MAP[pin];this.ports[port].setPin(bit,value);}
 /** @brief Execute real instructions until cycle budget is reached; one instruction can cross the boundary. */
 runCycles(budget:number):RuntimeSnapshot {
  if(this.state!=='running')throw new RuntimeError('INVALID_STATE','CPU must be running to execute cycles.');
  if(!Number.isSafeInteger(budget)||budget<1||budget>250000)throw new RuntimeError('INVALID_BUDGET','Cycle budget must be an integer from 1 to 250000.');
  const end=this.cpu.cycles+budget;
  try{while(this.cpu.cycles<end){const opcode=this.cpu.progMem[this.cpu.pc];
   if(!isRecognizedOpcode(opcode))throw new RuntimeError('UNSUPPORTED_OPCODE',`Unsupported AVR opcode 0x${opcode?.toString(16)} at byte ${this.cpu.pc*2}.`);
   if([0x9588,0x95e8,0x95f8,0x95a8,0x9598].includes(opcode))throw new RuntimeError('UNSUPPORTED_OPERATION','Sleep, self-programming, watchdog and debug-break operations are unsupported.');
   avrInstruction(this.cpu);this.cpu.tick();
  }}catch(error){this.state='stopped';if(error instanceof RuntimeError)throw error;throw new RuntimeError('EXECUTION_ERROR',error instanceof Error?error.message:'AVR execution failed.');}
  return this.snapshot();
 }
 /** @brief Read current cycle-derived state, draining bounded event and UART batches. */
 snapshot():RuntimeSnapshot {const result:RuntimeSnapshot={cycles:this.cpu.cycles,timeMicros:this.cpu.cycles/(UNO_CLOCK_HZ/1e6),state:this.state,gpio:this.readLevels(),serial:this.serial,transitions:this.transitions};this.serial='';this.transitions=[];return result;}
}
