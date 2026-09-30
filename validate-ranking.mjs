import fs from 'node:fs';import assert from 'node:assert/strict';import{rank,lithiumPrediction}from './public/ranking.js';
const read=n=>JSON.parse(fs.readFileSync('public/data/'+n+'.json'));
const d={lithium:read('lithium-grid'),spectrum:read('spectral-index'),seismic:read('seismic-density'),evidence:read('evidence')};
const groups=[{phase:-1,solutions:[{phase:-1,age:7.48,mass:.995,metallicity:0}]},{phase:0,solutions:[{phase:0,age:9.72,mass:.974,metallicity:0}]}];
const q={T:5772,logL:0,diagnostic:'none',lithium:20};
assert.deepEqual(rank(groups,q,d).rows.map(r=>r.percent),[50,50]);
q.diagnostic='lithium';const low=rank(groups,q,d);assert.equal(low.rows[0].phase,0);
q.lithium=180;const high=rank(groups,q,d);assert.equal(high.rows[0].phase,-1);assert.ok(Math.abs(high.rows.reduce((n,r)=>n+r.percent,0)-100)<1e-8);
assert.equal(rank(groups.map(g=>({...g,solutions:[...g.solutions,...g.solutions]})),q,d).rows[0].percent,high.rows[0].percent);
assert.equal(lithiumPrediction(d.lithium,7000,8,0),null);assert.equal(lithiumPrediction(d.lithium,5772,10,0),null);
assert.equal(rank([{phase:6,solutions:[{age:8,mass:.6,metallicity:0}]}],q,d).rows[0].percent,null);
const giant=[2,3,4,5].map(phase=>({phase,solutions:[{age:9,mass:1,metallicity:0}]}));
for(const e of d.evidence.seismic.examples){const r=rank(giant,{...q,...e,diagnostic:'seismic'},d);assert.ok(r.rows.some(x=>x.percent!==null));assert.equal(r.rows.find(x=>x.phase===2).percent,r.rows.find(x=>x.phase===5).percent);assert.equal(r.rows[0].phase===3,e.label===2)}
assert.ok(rank(giant,{...q,diagnostic:'seismic',Dnu:1e5,numax:1e5,DPi1:1e5},d).rows.every(r=>r.percent===null));
fs.writeFileSync('validation/v12-ranking.json',JSON.stringify({passed:true,checks:['equal starting shares','lithium shifts ranking','normalization','duplication invariance','unsupported age and temperature','unscored remnants','shell phases remain tied','seismic hull guard'],meaning:'Conditional relative-fit shares, not calibrated posterior probabilities'},null,2));console.log('Ranking checks passed');
