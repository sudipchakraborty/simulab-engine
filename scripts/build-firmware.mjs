/** @file build-firmware.mjs @brief Recompile checked-in ATmega328P fixtures with caller-selected AVR toolchain. */
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const toolBin=process.argv[2] || process.env.AVR_TOOLCHAIN_BIN || join(root,'scripts','.toolchain','avr','bin');
const ext=process.platform==='win32'?'.exe':'';
const gcc=join(toolBin,'avr-gcc'+ext);
const objcopy=join(toolBin,'avr-objcopy'+ext);
const size=join(toolBin,'avr-size'+ext);
function run(exe,args) {const r=spawnSync(exe,args,{cwd:root,encoding:'utf8'});if(r.error)throw r.error;if(r.status!==0)throw new Error(r.stderr||r.stdout||`${exe} failed`);return r.stdout.trim();}
const version=run(gcc,['--version']).split('\n')[0];
const hash=p=>createHash('sha256').update(readFileSync(join(root,p))).digest('hex');
const fixtures=[];
for(const [name,macro,pin,source] of [['blink-uart','PB5','D13','blink-uart.c'],['alternate-d12','PB4','D12','blink-uart.c'],['input-mirror','PB3','D11','input-mirror.c']]) {
 const args=['-mmcu=atmega328p','-DF_CPU=16000000UL',`-DLED_BIT=${macro}`,'-std=gnu11','-Os','-Wall','-Wextra','-Werror','-ffunction-sections','-fdata-sections','-Wl,--gc-sections',`-Wl,-Map=firmware/${name}.map`,'-o',`firmware/${name}.elf`,`firmware/${source}`];
 run(gcc,args);run(objcopy,['-O','ihex','-R','.eeprom',`firmware/${name}.elf`,`firmware/${name}.hex`]);
 const sizes=run(size,[`firmware/${name}.elf`]);console.log(name+'\n'+sizes);
 fixtures.push({name,target:'atmega328p',clockHz:16000000,outputPin:pin,timer:name==='input-mirror'?null:'Timer1 CTC OCR1A=15624 prescaler=256',toggleIntervalCycles:name==='input-mirror'?null:4000000,toggleIntervalMicros:name==='input-mirror'?null:250000,uartBaudRequested:name==='input-mirror'?null:9600,uartRegisterDivisor:name==='input-mirror'?null:103,uartExpected:name==='input-mirror'?[]:['SIMULAB AVR READY\n','LED ON\n','LED OFF\n'],compiler:version,compilerCommand:['avr-gcc',...args].join(' '),objcopyCommand:`avr-objcopy -O ihex -R .eeprom firmware/${name}.elf firmware/${name}.hex`,source,sourceSha256:hash(`firmware/${source}`),elfSha256:hash(`firmware/${name}.elf`),hexSha256:hash(`firmware/${name}.hex`),sizes});
}
writeFileSync(join(root,'firmware','metadata.json'),JSON.stringify({schemaVersion:'1.0.0',toolchain:{sourceIndex:'https://downloads.arduino.cc/packages/package_index.json',url:'https://downloads.arduino.cc/tools/avr-gcc-7.3.0-atmel3.6.1-arduino7-i686-w64-mingw32.zip',archiveSha256:'a54f64755fff4cb792a1495e5defdd789902a2a3503982e81b898299cf39800e'},hardwareComparison:'not performed',fixtures},null,2)+'\n');
console.log('Compiled three actual AVR firmware fixtures and recorded SHA-256 provenance.');
