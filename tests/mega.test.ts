import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {AvrRuntime} from '../src/uno';
import {parseIntelHex} from '../src/hex';
it('loads 256KiB HEX addresses only with the explicit ATmega2560 flash profile',()=>{
 const hex=':020000000000FE\n:020000040003F7\n:01000000AB54\n:00000001FF';
 expect(()=>parseIntelHex(hex)).toThrow();expect(parseIntelHex(hex,262144)[0x30000]).toBe(0xab);
});
it('executes actual Mega firmware with native high-register ports, 3-byte PC, timer vectors and UART',()=>{
 const r=new AvrRuntime(readFileSync('firmware/mega2560.hex','utf8'),{mcu:'atmega2560'});r.start();r.setPin('D2',true);
 let serial='',transitions:ReturnType<AvrRuntime['snapshot']>['transitions']=[];let s=r.snapshot();
 for(let n=0;n<34;n++){s=r.runCycles(250000);serial+=s.serial;transitions.push(...s.transitions);}
 expect(s.gpio.D49).toBe(1);expect(s.gpio.A8).toBe(1);expect(s.gpio.D4).toBe(1);expect(serial).toContain('MEGA2560 REAL UART');
 const edges=transitions.filter(e=>e.pin==='D13'&&e.level!==null);expect(edges.length).toBeGreaterThanOrEqual(3);expect(Math.abs(edges.at(-1)!.cycle-edges.at(-2)!.cycle-4e6)).toBeLessThan(30);
 expect(r.debugSnapshot().sp).toBeGreaterThan(0x2000);r.setPin('D2',false);expect(r.runCycles(1000).gpio.D4).toBe(0);
 r.uartInput(new Uint8Array([88]));let echo='';for(let n=0;n<3;n++)echo+=r.runCycles(160000).serial;expect(echo).toContain('X');
});
