import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {buildMesh,inferPoint} from './public/point-inference.js';
import {buildCooling,inferCooling} from './public/cooling.js';
import {rank} from './public/ranking.js';
import {observedMeasurements,compareReference} from './public/observed.js';
const read=p=>JSON.parse(fs.readFileSync(p)),dataset=read('public/data/diagnostic-stars.json');
const cd=read('public/data/cooling-grid.json'),cooling=buildCooling(cd);
const meshes=read('public/data/manifest.json').files.map(f=>{const b=zlib.gunzipSync(fs.readFileSync('public/data/'+f.name)),m=buildMesh(new Float32Array(b.buffer,b.byteOffset,b.byteLength/4));m.metallicity=f.initial_feh;return m});
const data={spectrum:read('public/data/spectral-index.json'),lithium:read('public/data/lithium-grid.json'),evidence:read('public/data/evidence.json'),seismic:read('public/data/seismic-density.json')};
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public/data/observed-stars.json')).digest('hex'),'6303aeef763b9a7820bdbae220ea873efab5860660d9312f44d7d2be35323532');
assert.equal(dataset.stars.length,new Set(dataset.stars.map(s=>s.id)).size);
assert.deepEqual(inferCooling(cooling,{T:5772,logL:0}),[]);
assert.deepEqual(inferCooling(cooling,{T:1e6,logL:0}),[]);
// Check interpolation against original tabulated models at actual grid vertices.
for(const grid of cd.grids)for(const r of grid.rows.filter((_,i)=>i%29===0)){
 const result=inferCooling(cooling,{T:10**r[0],logL:r[1]});assert.ok(result.length);
 assert.ok(result[0].solutions.some(s=>s.atmosphere===grid.atmosphere&&Math.abs(s.mass-r[2])<1e-7));
 assert.ok(result[0].solutions.every(s=>s.initialMass===null&&s.age===null));
}
const predictions=[];
for(const star of dataset.stars){
 const q=observedMeasurements(star),available=q.measurements;q.measurements=star.exampleSetup.measurements;q.diagnostic=q.measurements.at(-1)||'none';
 assert.ok(q.measurements.every(n=>available.includes(n)));
 assert.equal(q.classCode,undefined);assert.equal(q.stageReference,undefined);
 const mutated=observedMeasurements({...star,catalogClass:'Opposite label',classCode:999,stageReference:{phases:[999]},spectralType:'Wrong label'});
 assert.deepEqual({...mutated,measurements:q.measurements,diagnostic:q.diagnostic},q);
 const groups=[...inferPoint(meshes,{T:q.T,logL:q.logL,allSolutions:true}).groups,...inferCooling(cooling,q)];
 const result=rank(groups,q,data),scored=result.rows.filter(r=>r.percent!==null);
 assert.ok(scored.length>0&&!result.conflict,'Missing diagnostic support: '+star.id);
 assert.ok(Math.abs(scored.reduce((s,r)=>s+r.percent,0)-100)<1e-8);
 if(q.measurements.length)assert.ok(scored.length>=2&&Math.max(...scored.map(r=>r.percent))-Math.min(...scored.map(r=>r.percent))>1e-6);
 else assert.equal(groups.length,1);
 predictions.push({id:star.id,reference:star.catalogClass,enabled:q.measurements,comparison:compareReference(star,result),partial:result.partial,rows:result.rows.map(r=>({phase:r.phase,percent:r.percent}))});
}
// Dynamical masses are held out and used here only as external plausibility checks.
const known={'Sirius B':1.018,'40 Eridani B':.573,'Procyon B':.592,'Stein 2051 B':.675};
const compact=[];
for(const star of dataset.stars.filter(s=>s.catalogClass==='White dwarf')){
 const g=inferCooling(cooling,{T:star.T,logL:Math.log10(star.luminosity)})[0];
 const nearest=Math.min(...g.solutions.map(s=>Math.abs(s.mass-known[star.displayName])/known[star.displayName]));
 assert.ok(nearest<.15,'Cooling benchmark mass mismatch');compact.push({star:star.displayName,modelMassRange:g.mass,nearestRelativeMassDifference:nearest});
}
const result={passed:true,count:predictions.length,categories:dataset.manifest.categories,referenceLabelLeakage:false,originalDatabaseUnchanged:true,compact,
 disagreements:predictions.filter(p=>/disagree/i.test(p.comparison)).length,notDirectlyComparable:predictions.filter(p=>/not directly comparable/i.test(p.comparison)).length,
 caution:'No accuracy fraction: examples are coverage-selected, reference categories are heterogeneous, and many solutions remain untested.',predictions};
fs.mkdirSync('validation',{recursive:true});fs.writeFileSync('validation/v22-science.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,predictions:undefined},null,2));
