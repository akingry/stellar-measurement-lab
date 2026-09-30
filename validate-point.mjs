import fs from 'node:fs';import zlib from 'node:zlib';import assert from 'node:assert/strict';import{buildMesh,inferPoint}from './public/point-inference.js';
const root=new URL('.',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('public/data/manifest.json',root))),meshes=[];const t0=performance.now();
for(const f of manifest.files){const b=zlib.gunzipSync(fs.readFileSync(new URL('public/data/'+f.name,root))),a=new Float32Array(b.buffer,b.byteOffset,b.byteLength/4);meshes.push(buildMesh(a))}
const queries=[];
for(const e of manifest.examples){const r=inferPoint(meshes,{T:10**e.row[0],logL:e.row[1]});assert.ok(r.groups.some(p=>p.phase===e.row[7]),e.name);assert.ok(r.maxResidual<1e-9);queries.push({name:e.name,groups:r.groups.map(p=>({phase:p.phase,mass:p.mass})),residual:r.maxResidual})}
// Synthetic points strictly inside actual cells must recover their known
// barycentrically interpolated mass, not a nearby vertex mass range.
let recovered=0;for(const mesh of meshes){const{a,indices}=mesh;for(let n=0;n<indices.length;n+=Math.max(3,Math.floor(indices.length/18/3)*3)){const ids=[indices[n],indices[n+1],indices[n+2]],w=[.2,.3,.5],v=c=>ids.reduce((s,i,j)=>s+w[j]*a[i+c],0),r=inferPoint([mesh],{T:10**v(0),logL:v(1)}),p=r.groups.find(p=>p.phase===a[ids[0]+7]);assert.ok(p);assert.ok(p.mass[0]<=v(4)+1e-6&&p.mass[1]>=v(4)-1e-6);assert.ok(r.maxResidual<1e-9);recovered++}}
assert.equal(inferPoint(meshes,{T:2000,logL:7}).count,0);
for(const [T,L]of [[3500,1e5],[4000,1e4],[5772,1]]){const start=performance.now(),r=inferPoint(meshes,{T,logL:Math.log10(L)});queries.push({T,L,query_ms:performance.now()-start,groups:r.groups.map(p=>({phase:p.phase,mass:p.mass})),residual:r.maxResidual})}
const report={passed:true,triangles:meshes.reduce((s,m)=>s+m.triangles,0),excludedWideTriangles:meshes.reduce((s,m)=>s+m.rejected,0),syntheticInteriorPoints:recovered,totalMs:performance.now()-t0,queries};fs.writeFileSync(new URL('validation/point-science.json',root),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
