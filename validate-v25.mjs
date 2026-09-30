import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {buildMesh,inferPoint}from './public/point-inference.js';
import {buildCooling}from './public/cooling.js';
import {prepareObservedGrid,inferObserved,initialMassDensity}from './public/observed-inference.js';
import {inferForQuery}from './public/candidate-inference.js';
import {rankObserved}from './public/observed-ranking.js';
import {rank}from './public/ranking.js';
import {observedMeasurements,referenceIndicator}from './public/observed.js';
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest=read('public/data/manifest.json');
const meshes=manifest.files.map((f,j)=>{const b=zlib.gunzipSync(fs.readFileSync('public/data/'+f.name)),m=buildMesh(new Float32Array(b.buffer,b.byteOffset,b.byteLength/4));m.metallicity=f.initial_feh;m.metallicityWidth=((manifest.files[j+1]?.initial_feh??f.initial_feh)-(manifest.files[j-1]?.initial_feh??f.initial_feh))/2;return prepareObservedGrid(m)});
const cooling=buildCooling(read('public/data/cooling-grid.json'));
const data={spectrum:read('public/data/spectral-index.json'),lithium:read('public/data/lithium-grid.json'),seismic:read('public/data/seismic-density.json'),evidence:read('public/data/evidence.json')};
const baseline=read('public/data/sample-audit.json'),stars=read('public/data/diagnostic-stars.json').stars;
const hashes=Object.fromEntries(['public/data/diagnostic-stars.json','public/data/observed-stars.json','public/data/diagnostic-benchmark.sqlite','public/data/observed-stars.sqlite'].map(p=>[p,hash(p)]));
const records=[];
for(const star of stars){
 const q={...observedMeasurements(star),allSolutions:true};
 const mutated={...star,catalogClass:'Wrong',classCode:999,stageReference:{phases:[999]},exampleSetup:{measurements:[]}};
 assert.deepEqual(observedMeasurements(mutated),observedMeasurements(star));
 const result=inferForQuery(meshes,cooling,q),r=rankObserved(result.groups,q,data),old=baseline.records.find(x=>x.id===star.id);
 assert.ok(r.rows.length,'No model for '+star.id);
 assert.ok(r.rows.every(x=>Number.isFinite(x.percent)&&x.percent>=0));
 assert.ok(Math.abs(r.rows.reduce((s,x)=>s+x.percent,0)-100)<1e-7);
 if(star.classCode===1)assert.ok(r.rows.find(x=>x.phase===2)?.percent>0,'Subgiant candidate erased');
 records.push({id:star.id,reference:star.catalogClass,previousStatus:old.status,status:referenceIndicator(star,r).status,comparison:referenceIndicator(star,r).detail,mode:result.mode,measurements:q.measurements,previousLeader:old.prediction.rows[0].phase,rows:r.rows.map(x=>({phase:x.phase,percent:x.percent,partial:x.partial})),count:result.count,coverage:r.coverage});
 if(star.id===4840662){assert.equal(r.rows[0].phase,2);assert.ok(q.measurements.includes('seismic'));assert.equal(q.T,4408);assert.ok(Math.abs(10**q.logL-star.luminosity)<1e-12);}
 if(star.id==='WD:Sirius B')assert.equal(r.rows[0].phase,10);
}
// Missing lithium calibration cannot remove an evolved candidate's support.
const subject=stars.find(s=>s.id===7022298),query={...observedMeasurements(subject),allSolutions:true};
const groups=inferForQuery(meshes,cooling,query).groups;
const withLi=rankObserved(groups,query,data),withoutLi=rankObserved(groups,{...query,measurements:[]},data);
assert.ok(Math.abs(withLi.rows.find(r=>r.phase===2).percent-withoutLi.rows.find(r=>r.phase===2).percent)<1e-8);
for(const m of meshes){assert.ok(m.observedWeights.some(w=>w>0));assert.ok(m.observedWeights.every(w=>Number.isFinite(w)&&w>=0))}
assert.ok(Math.abs(initialMassDensity(.5-1e-8)-initialMassDensity(.5+1e-8))<1e-6);
// Sensitivity is measured, never selected to make a catalog label match.
const sensitivity=[];
for(const rho of [-.5,0,.5]){
 const q={...query,observationErrors:{...query.observationErrors,correlation:rho}},r=rankObserved(inferObserved(meshes,q).groups,q,data);
 sensitivity.push({correlation:rho,rows:r.rows.map(x=>({phase:x.phase,percent:x.percent}))});
}
const manual={T:5772,logL:0,measurements:['lithium'],diagnostic:'lithium',lithium:75,lithiumError:5,allSolutions:true};
assert.deepEqual(rank(inferForQuery(meshes,cooling,manual).groups,manual,data),rank(inferPoint(meshes,manual).groups,manual,data));
for(const[p,v]of Object.entries(hashes))assert.equal(hash(p),v);
const counts=Object.fromEntries(['match','mismatch','neutral'].map(k=>[k,records.filter(r=>r.status===k).length]));
const transitions={};for(const r of records){const k=r.previousStatus+' -> '+r.status;transitions[k]=(transitions[k]||0)+1}
const out={passed:true,version:25,count:records.length,counts,transitions,allSubgiantCandidatesScored:true,referenceLabelLeakage:false,originalDatabasesUnchanged:true,manualModeUnchanged:true,assumptions:['Independent recorded temperature/radius errors when covariance unavailable','Uniform linear formation age, Kroupa initial-mass density, uniform tabulated initial metallicity','Diagnostics refine support only within their calibrated domain; not a full generative posterior','Exact-position fallback for cooling models and records with incomplete uncertainties'],hashes,sensitivity,records};
fs.writeFileSync('public/data/v25-validation.json',JSON.stringify(out,null,2));fs.writeFileSync('validation/v25-science.json',JSON.stringify(out,null,2));
console.log(JSON.stringify({...out,records:undefined,hashes:undefined,sensitivity:undefined},null,2));
