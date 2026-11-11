import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {UnoRuntime} from '../src/uno';
it('executes real Timer0 PWM, Timer2 CTC, I2C and UART echo firmware',()=>{
 const writes:number[][]=[];const bus={write:(address:number,bytes:number[])=>{expect(address).toBe(0x68);writes.push([...bytes]);return true;},read:()=>[0]};
 const r=new UnoRuntime(readFileSync('firmware/peripherals.hex','utf8'),{i2c:bus});r.start();
 const events=[];for(let i=0;i<3;i++)events.push(...r.runCycles(160000).transitions);
 expect(writes.some(w=>w[0]===0)).toBe(true);
 for(const pin of ['D6','D11'])expect(events.filter(e=>e.pin===pin).length).toBeGreaterThan(10);
 const timer2=events.filter(e=>e.pin==='D11').slice(4,8);expect(timer2.slice(1).map((e,i)=>e.cycle-timer2[i].cycle).every(n=>Math.abs(n-8000)<=2)).toBe(true);
 const rising=events.filter(e=>e.pin==='D6'&&e.level===1).slice(4,8);expect(rising.slice(1).map((e,i)=>e.cycle-rising[i].cycle).every(n=>Math.abs(n-2048)<=2)).toBe(true);
 r.uartInput(new Uint8Array([65]));let out='';for(let i=0;i<3;i++)out+=r.runCycles(160000).serial;
 expect(out).toContain('A');expect(r.debugSnapshot().pcBytes).toBeGreaterThan(0);
});
it('delivers synchronous GPIO hooks so external components can feed real MCU inputs',()=>{
 let edges=0;
 const r=new UnoRuntime(readFileSync('firmware/input-mirror.hex','utf8'),{onGpioTransition:()=>{edges++;}});
 r.start();r.setPin('D2',false);r.runCycles(160000);r.setPin('D2',true);r.runCycles(160000);
 expect(edges).toBeGreaterThan(0);r.setPinLevel('D2',null);
});
