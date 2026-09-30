import {lithiumPrediction,seismicLikelihoods} from './ranking.js?v=25';
import {spectralCalibration,spectralGravity} from './spectral.js';
const sumLog=a=>{const m=a.reduce((m,x)=>Math.max(m,x),-Infinity);return Number.isFinite(m)?m+Math.log(a.reduce((s,x)=>s+Math.exp(x-m),0)):-Infinity};
export function measuredSeismicShares(q,data){
 const error=Number.isFinite(q.spacingError)&&q.spacingError>0?q.spacingError:0;
 const samples=error?[[-Math.sqrt(3),1/6],[0,2/3],[Math.sqrt(3),1/6]]:[[0,1]];
 let shell=0,helium=0,coverage=0;
 for(const [z,w]of samples){const p=seismicLikelihoods({...q,DPi1:q.DPi1+z*error},data);if(!p)continue;shell+=w*p.shell;helium+=w*p.helium;coverage+=w}
 return shell+helium>0?{shell:shell/(shell+helium),helium:helium/(shell+helium),coverage}:null;
}
// Conditional updates retain the support outside each calibration's domain.
// Thus an evolved candidate keeps its positional support when lithium is absent
// from its calibration. These are model-weighted fit shares, NOT full posteriors.
export function rankObserved(groups,q,data){
 const entries=groups.flatMap(g=>g.solutions.map(s=>({s,phase:g.phase,log:Number.isFinite(s.baseLogWeight)?s.baseLogWeight:-Math.log(g.solutions.length),applied:[],untested:[]})));
 const shares=q.measurements.includes('seismic')?measuredSeismicShares(q,data):null,predict=spectralCalibration(data.spectrum);
 const coverage=[];
 for(const diagnostic of ['spectrum','lithium','seismic'].filter(n=>q.measurements.includes(n))){
  const supported=[];let minChi=Infinity;
  for(const entry of entries){
   const s=entry.s,T=10**s.logT;let log=null,chi=null;
   if(diagnostic==='lithium'&&[-1,0].includes(entry.phase)){
    const p=lithiumPrediction(data.lithium,T,s.age,s.metallicity);
    if(p){const sigma=Math.hypot(p[1],Number.isFinite(q.lithiumError)?q.lithiumError:5);chi=((q.lithium-p[0])/sigma)**2;log=-.5*chi-Math.log(sigma)}
   }
   if(diagnostic==='spectrum'&&[-1,0,2,3].includes(entry.phase)){
    const p=predict(T,spectralGravity(T,s.logL,s.mass),s.metallicity);
    if(p!==null){chi=((q.wing-p)/.01)**2;log=-.5*chi}
   }
   if(diagnostic==='seismic'&&shares&&[2,3,4,5].includes(entry.phase))log=Math.log(Math.max(Number.MIN_VALUE,entry.phase===3?shares.helium:shares.shell));
   if(log!==null&&Number.isFinite(log)){supported.push({entry,log});if(chi!==null)minChi=Math.min(minChi,chi)}else entry.untested.push(diagnostic);
  }
  // Preserve uncalibrated support. Do not compare likelihoods with different units.
  if(supported.length){
   const before=sumLog(supported.map(x=>x.entry.log)),after=sumLog(supported.map(x=>x.entry.log+x.log));
   for(const {entry,log}of supported){
    const updated=entry.log+log+before-after;
    // Unknown uncertainty tails retain positional support, not extrapolated evidence.
    const fraction=diagnostic==='seismic'?shares.coverage:1;
    entry.log=fraction<1-1e-12?sumLog([updated+Math.log(fraction),entry.log+Math.log1p(-fraction)]):updated;
    entry.applied.push(diagnostic);if(fraction<1-1e-12)entry.untested.push('seismic error tail');
   }
  }
  coverage.push({diagnostic,tested:supported.length,total:entries.length,calibratedErrorFraction:diagnostic==='seismic'?(shares?.coverage||0):null,conflict:minChi>25&&Number.isFinite(minChi),unavailable:!supported.length});
 }
 const total=sumLog(entries.map(x=>x.log));
 const rows=groups.map(g=>{
  const list=entries.filter(e=>e.phase===g.phase),log=sumLog(list.map(e=>e.log)),best=list.reduce((a,b)=>a.log>b.log?a:b);
  const tested=list.filter(e=>e.untested.length===0).length;
  return {...g,log,chosen:best.s,tested,total:list.length,partial:tested<list.length,percent:Math.exp(log-total)*100,positionalSupport:true};
 }).sort((a,b)=>b.percent-a.percent||a.phase-b.phase);
 const conflict=entries.length>0&&entries.every(e=>e.s.positionChi>25);
 if(conflict)for(const row of rows)row.percent=null;
 return {rows,conflict,diagnosticConflicts:coverage.filter(x=>x.conflict),coverage,measurements:q.measurements,active:q.diagnostic,partial:rows.some(r=>r.partial),tied:rows.filter(r=>r.percent!==null&&Math.abs(r.percent-(rows[0]?.percent??0))<1e-8).length>1,mode:q.fittingMode||'observed-uncertainty',conditional:true};
}
