import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {buildMesh,inferPoint} from '../public/point-inference.js';
import {rank} from '../public/ranking.js';
import {observedMeasurements,compareReference} from '../public/observed.js';
import {buildCooling,inferCooling} from '../public/cooling.js';

const read=p=>JSON.parse(fs.readFileSync(p));
const source=process.argv[2]||'public/data/observed-stars.json', original=fs.readFileSync(source);
const parent=JSON.parse(original), manifest=read('public/data/manifest.json');
const data={spectrum:read('public/data/spectral-index.json'),lithium:read('public/data/lithium-grid.json'),evidence:read('public/data/evidence.json'),seismic:read('public/data/seismic-density.json')};
const cooling=buildCooling(read('public/data/cooling-grid.json'));
const meshes=manifest.files.map(f=>{
 const bytes=fs.readFileSync('public/data/'+f.name);
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==f.sha256)throw Error('Model checksum mismatch');
 const b=zlib.gunzipSync(bytes),m=buildMesh(new Float32Array(b.buffer,b.byteOffset,b.byteLength/4));m.metallicity=f.initial_feh;return m;
});
const audit=[],examples=[];
for(const star of parent.stars){
 const q=observedMeasurements(star);
 const groups=inferPoint(meshes,{T:q.T,logL:q.logL,allSolutions:true}).groups;
 groups.push(...inferCooling(cooling,q));
 const diagnostics=q.measurements.map(name=>{
  const query={...q,diagnostic:name,measurements:[name]},r=rank(groups,query,data);
  const scored=r.rows.filter(x=>x.percent!==null);
  const differentiates=!r.conflict&&scored.length>=2&&Math.max(...scored.map(x=>x.percent))-Math.min(...scored.map(x=>x.percent))>1e-6;
  // Reference labels are consulted only AFTER inference and qualification.
  const altered={...star,classCode:999,catalogClass:'changed reference only',stageReference:null};
  if(JSON.stringify(observedMeasurements(altered))!==JSON.stringify(q))throw Error('Label leakage');
  return {name,differentiates,conflict:r.conflict,partial:r.partial,comparison:compareReference(star,r),
   unsupportedPhases:r.rows.filter(x=>!x.tested).map(x=>x.phase),
   fits:r.rows.map(x=>({phase:x.phase,relativeFit:x.percent,tested:x.tested,total:x.total}))};
 });
 if(groups.length===1){
  const r=rank(groups,{...q,diagnostic:'none',measurements:[]},data);
  diagnostics.unshift({name:'position',differentiates:true,conflict:false,partial:false,
   comparison:compareReference(star,r),unsupportedPhases:[],
   fits:r.rows.map(x=>({phase:x.phase,relativeFit:x.percent,tested:x.tested,total:x.total})),
   note:'Only one phase at the recorded temperature and luminosity in this grid; not proof of unique classification in nature.'});
 }
 const qualified=diagnostics.filter(d=>d.differentiates).map(d=>d.name);
 const record={star,availableDiagnostics:q.measurements,qualifiedDiagnostics:qualified,diagnostics};
 audit.push(record);if(qualified.length)examples.push(record);
}
const countBy=key=>Object.fromEntries([...new Set(examples.map(x=>key(x)))].sort().map(k=>[k,examples.filter(x=>key(x)===k).length]));
const summary={generatedAt:new Date().toISOString(),sourcePath:source,status:'research cohort; not complete representative coverage',parentCount:parent.stars.length,parentSha256:crypto.createHash('sha256').update(original).digest('hex'),
 audited:audit.length,qualified:examples.length,qualification:'One phase at recorded temperature/luminosity OR at least two stages with unequal finite fits from an observed diagnostic. No agreement filtering. Unsupported alternatives and shared reference evidence remain explicit.',
 categories:countBy(x=>x.star.catalogClass),diagnosticSets:countBy(x=>x.qualifiedDiagnostics.join('+')),
 partial:examples.filter(x=>x.diagnostics.some(d=>d.differentiates&&d.partial)).length,
 missingStageCoverage:['Separated subgiant versus red-giant-branch predictions','Early versus thermally pulsing asymptotic giant branch','Post-asymptotic-giant-branch and white-dwarf cooling'],
 selection:'All eligible parent records audited. Measurements remain unchanged. Diagnostic selection does not use catalog agreement. This is measurement- and model-sensitivity-selected, not an unbiased accuracy benchmark.',sources:parent.manifest.sources};
fs.writeFileSync('diagnostics/representative/diagnostic-audit.json',JSON.stringify({summary,records:audit},null,2));
fs.writeFileSync('diagnostics/representative/diagnostic-examples.json',JSON.stringify({manifest:summary,examples},null,2));
if(!fs.readFileSync(source).equals(original))throw Error('Original database changed');
console.log(JSON.stringify({...summary,sources:undefined},null,2));
