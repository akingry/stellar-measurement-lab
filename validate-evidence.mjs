import fs from 'node:fs';import assert from 'node:assert/strict';
import{seismic,technetium,inside}from './public/evidence.js';
const d=JSON.parse(fs.readFileSync('public/data/evidence.json'));
let q={useSeismic:true,useTechnetium:true,spacingError:0};
for(const r of d.seismic.examples){const s=seismic({...q,...r},d.seismic);assert.equal(s.status,'supported');assert.equal(s.code,r.label)}
assert.equal(seismic({...q,Dnu:10000,numax:10000,DPi1:200},d.seismic).status,'outside');
assert.equal(seismic({...q,Dnu:NaN,numax:40,DPi1:200},d.seismic).status,'outside');
assert.equal(seismic({...q,...d.seismic.examples[0],spacingError:1000},d.seismic).status,'outside');
assert.equal(seismic({...q,useSeismic:false},d.seismic).status,'off');
for(const [label,g]of Object.entries(d.technetium.groups)){const r=technetium({...q,tc4238:g.example[0],tc4262:g.example[1]},d.technetium);assert.equal(r.status,'supported');assert.equal(r.rich,label==='technetium-rich')}
assert.equal(technetium({...q,tc4238:0,tc4262:0},d.technetium).status,'outside');
assert.equal(technetium({...q,useTechnetium:false},d.technetium).status,'off');
// Find a supported boundary point, then require interval overlap rather than a tie-break.
let overlap=false;
for(let f=2;f<15;f+=.2)for(let n=15;n<150;n+=2){const r=seismic({...q,Dnu:f,numax:n,DPi1:127.95,spacingError:3},d.seismic);if(r.status==='ambiguous')overlap=true}
assert.ok(overlap);
// Exported JavaScript predictions must reproduce every saved held-out prediction
// within the domain. Out-of-envelope points must remain unsupported.
const parse=path=>{const [h,...lines]=fs.readFileSync(path,'utf8').trim().split(/\r?\n/);return lines.map(l=>Object.fromEntries(l.split(',').map((v,i)=>[h.split(',')[i],v])))};
const refs=new Map(parse('diagnostics/mixed-mode-consensus-plus_period_spacing-tree-predictions.csv').map(r=>[r.KIC,+r.prediction]));
let checked=0,outside=0;
for(const r of parse('diagnostics/mixed-mode-consensus-cohort.csv').filter(r=>r.partition==='test')){const s=seismic({...q,Dnu:+r.Dnu,numax:+r.numax,DPi1:+r.DPi1},d.seismic);if(s.status==='supported'){assert.equal(s.code,refs.get(r.KIC));checked++}else{assert.equal(s.status,'outside');outside++}}
const report={passed:true,checked,outside,intervalOverlapPreserved:true,technetiumPatternsVerified:true,notIndependentStageValidation:true};fs.mkdirSync('validation',{recursive:true});fs.writeFileSync('validation/v10-science.json',JSON.stringify(report,null,2));console.log(report);
