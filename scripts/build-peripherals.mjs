/** @file Rebuild additive verification firmware without changing original fixture provenance. */
import {spawnSync} from 'node:child_process';import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),bin=resolve(root,'scripts/.toolchain/avr/bin');
const exe=n=>resolve(bin,n+(process.platform==='win32'?'.exe':''));
const run=(tool,args)=>{const r=spawnSync(exe(tool),args,{cwd:root,encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr);return r.stdout;};
for (const name of ['peripherals','dynamic-mux']) {
const args=['-mmcu=atmega328p','-DF_CPU=16000000UL','-std=gnu11','-Os','-Wall','-Wextra','-Werror','-o',`firmware/${name}.elf`,`firmware/${name}.c`];
run('avr-gcc',args);run('avr-objcopy',['-O','ihex','-R','.eeprom',`firmware/${name}.elf`,`firmware/${name}.hex`]);
const sha=name=>createHash('sha256').update(readFileSync(resolve(root,'firmware',name))).digest('hex');
writeFileSync(resolve(root,`firmware/${name}-metadata.json`),JSON.stringify({compiler:run('avr-gcc',['--version']).split('\n')[0],command:['avr-gcc',...args],sourceSha256:sha(name+'.c'),elfSha256:sha(name+'.elf'),hexSha256:sha(name+'.hex'),hardwareComparison:'not performed'},null,2));

}
