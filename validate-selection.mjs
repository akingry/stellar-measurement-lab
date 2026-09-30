import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';
import {calibratedModels,bounds,coordinates,selectModel} from './public/selection.js';
import {spectralCalibration,spectralGravity} from './public/spectral.js';
import {radius,massFromGravity} from './public/engine.js';
const manifest=JSON.parse(fs.readFileSync('public/data/manifest.json')),f=manifest.files.find(f=>f.initial_feh===0),b=zlib.gunzipSync(fs.readFileSync('public/data/'+f.name)),a=new Float32Array(b.buffer,b.byteOffset,b.length/4);
const data=JSON.parse(fs.readFileSync('public/data/spectral-index.json')),predict=spectralCalibration(data),models=calibratedModels(a,predict),ranges=bounds(models);
assert.equal(data.rows.length,585);
for(const r of data.rows)assert.ok(Math.abs(predict(r.temperature,r.gravity,r.metallicity)-r.index)<1e-14);
for(const m of models){assert.ok([-1,0,2,3].includes(m.stage));assert.equal(m.mass,a[m.id*9+4]);assert.equal(m.wing,predict(m.T,spectralGravity(m.T,m.logL,m.mass),0));assert.ok(Math.abs(massFromGravity(radius(m.T,10**m.logL),spectralGravity(m.T,m.logL,m.mass))/m.mass-1)<1e-12)}
let checks=0,wingChanges=0;let m=selectModel(models,[Math.log10(5772),0,.08],ranges);
for(let k=0;k<3;k++)for(let j=0;j<=100;j++){const target=coordinates(m);target[k]=ranges[k][0]+j/100*(ranges[k][1]-ranges[k][0]);const next=selectModel(models,target,ranges,k);assert.ok(models.includes(next));assert.equal(selectModel(models,coordinates(next),ranges).id,next.id);if(k===2&&next.wing!==m.wing)wingChanges++;m=next;checks++}
assert.ok(wingChanges>30);assert.equal(predict(8000,4,0),null);
const report={passed:true,candidates:models.length,phases:[...new Set(models.map(m=>m.stage))],ranges,checks,wingChanges,spectra:585,allCandidatesPhysicsAndSpectrumChecked:true};fs.writeFileSync('validation/selection-science.json',JSON.stringify(report,null,2));console.log(report);
