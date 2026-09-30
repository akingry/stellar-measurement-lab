import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p));
const audit=read('public/data/sample-audit.json'),sample=read('public/data/diagnostic-stars.json'),baseline=read('validation/v22-science.json');
assert.equal(audit.records.length,133);assert.equal(new Set(audit.records.map(r=>r.id)).size,133);
assert.deepEqual(audit.counts,{match:101,mismatch:31,neutral:1});
for(const[path,hash]of Object.entries(audit.hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),hash);
for(const record of audit.records){
 const star=sample.stars.find(s=>s.id===record.id),old=baseline.predictions.find(s=>s.id===record.id);
 assert.ok(star&&old);assert.equal(record.previousComparison,old.comparison);
 assert.deepEqual(record.prediction.rows.map(({phase,percent})=>({phase,percent})),old.rows);
 assert.equal(record.measurements.temperature,star.T);assert.equal(record.measurements.luminosity,star.luminosity);
 assert.ok(record.reasons.length);
 if(record.status==='mismatch')assert.ok(record.improvements.length);
 for(const result of [record.prediction,...record.diagnosticAblations,record.uncertaintyExperiment,record.gravityExperiment].filter(Boolean)){
  const scored=result.rows.filter(x=>x.percent!==null);if(scored.length)assert.ok(Math.abs(scored.reduce((a,b)=>a+b.percent,0)-100)<1e-7);
 }
}
assert.equal(audit.records.filter(r=>r.status==='mismatch'&&r.reasons.some(x=>x.code==='reference-stage-not-calibrated')).length,24);
assert.equal(audit.records.filter(r=>r.comparison!==r.previousComparison).length,9);
const exception=audit.records.find(r=>r.id===4840662);
assert.equal(exception.sensitivity.referenceCoveredAtCenter,false);assert.equal(exception.sensitivity.referenceCoveredWithinOneSigma,true);
assert.equal(exception.uncertaintyExperiment.status,'match');
assert.ok(exception.uncertaintyExperiment.partial);
const result={passed:true,records:133,baselineUnchanged:true,databasesUnchanged:true,allMismatchesHaveCauseAndPlan:true,percentNormalization:true,experimentalRegressionsRetained:true};
fs.writeFileSync('validation/v24-audit.json',JSON.stringify(result,null,2));console.log(result);
