import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';
import{spectralCalibration,spectralGravity}from './public/spectral.js';import{buildMesh,inferPoint}from './public/point-inference.js';
const data=JSON.parse(fs.readFileSync('public/data/spectral-index.json')),predict=spectralCalibration(data);
for(const r of data.rows){assert.ok(Number.isFinite(r.index));assert.ok(Math.abs(predict(r.temperature,r.gravity,r.metallicity)-r.index)<1e-14)}
assert.equal(predict(3000,4,0),null);assert.equal(predict(8000,4,0),null);assert.equal(predict(5772,6,0),null);assert.equal(predict(5772,4,-3),null);
assert.ok(Math.abs(spectralGravity(5772,0,1)-4.438)<.001);
assert.ok(predict(5750,5,0)>predict(5750,4,0));
const manifest=JSON.parse(fs.readFileSync('public/data/manifest.json')),meshes=manifest.files.map(f=>{const b=zlib.gunzipSync(fs.readFileSync('public/data/'+f.name)),m=buildMesh(new Float32Array(b.buffer,b.byteOffset,b.byteLength/4));m.metallicity=f.initial_feh;return m});
const q={T:5772,logL:0},base=inferPoint(meshes,q),queries=[];
for(const wing of [.06,.08,.10,.12]){const r=inferPoint(meshes,{...q,useSpectrum:true,wing,wingError:.005},predict);assert.equal(r.spectral.untested,0);assert.equal(r.count+r.spectral.excluded,base.count);assert.ok(r.maxResidual<1e-9);queries.push({wing,count:r.count,excluded:r.spectral.excluded,masses:r.groups.map(p=>p.mass)})}
assert.ok(queries.some(r=>r.count>0&&r.count<base.count));assert.ok(new Set(queries.map(r=>JSON.stringify(r.masses))).size>1);
// Known synthetic spectra recover their generating evolution candidate at exactly the same diagram location.
let recovered=0;
for(const mesh of meshes){const a=mesh.a;for(let i=0;i<a.length;i+=9*149){const T=10**a[i],logL=a[i+1],mass=a[i+4],phase=a[i+7];if(![-1,0,2,3].includes(phase))continue;const wing=predict(T,spectralGravity(T,logL,mass),mesh.metallicity);if(wing===null)continue;const r=inferPoint([mesh],{T,logL,useSpectrum:true,wing,wingError:.00001},predict);assert.ok(r.groups.some(p=>!p.spectralUntested&&p.mass[0]<=mass+1e-8&&p.mass[1]>=mass-1e-8));recovered++}}
assert.ok(recovered>50);
const giantQ={T:4000,logL:4},giant=inferPoint(meshes,giantQ),filtered=inferPoint(meshes,{...giantQ,useSpectrum:true,wing:-.3,wingError:.001},predict);
assert.ok(filtered.spectral.untested>0);for(const p of giant.groups.filter(p=>p.phase>=4)){const kept=filtered.groups.find(x=>x.phase===p.phase&&x.spectralUntested);assert.deepEqual(kept.mass,p.mass)}
const report={passed:true,spectra:data.rows.length,recoveredSyntheticCandidates:recovered,queries,untestedLatePhasesRetained:true,extrapolationRejected:true};fs.writeFileSync('validation/spectral-science.json',JSON.stringify(report,null,2));console.log(report);
