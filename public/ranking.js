import{spectralCalibration,spectralGravity}from './spectral.js';
import{inside}from './evidence.js';
function density(x,d){let sum=0;for(const p of d.x){const v=x.map((n,i)=>n-p[i]);let z=0;for(let i=0;i<3;i++)for(let j=0;j<3;j++)z+=v[i]*d.inverse[i][j]*v[j];sum+=Math.exp(-z/2)}return sum/d.x.length/d.normalizer}
// Normalized profile-likelihood FIT SHARES, not calibrated posterior probabilities.
// Each stage contributes its best compatible solution, not its grid-point count.
export function lithiumPrediction(d,T,age,z){
 if(T<3000||T>6500||age<d.ages[0]||age>d.ages.at(-1)||z<-.3||z>.2)return null;
 function bracket(a,x){let i=a.findIndex(v=>v>=x);if(i===0)return[0,0,0];if(i<0)return null;return[i-1,i,(x-a[i-1])/(a[i]-a[i-1])]}
 const [a,b,w]=bracket(d.ages,age),[c,e,v]=bracket(d.temperatures,T);
 return[0,1].map(k=>(1-w)*((1-v)*d.rows[a][c][k]+v*d.rows[a][e][k])+w*((1-v)*d.rows[b][c][k]+v*d.rows[b][e][k]));
}
export function rank(groups,q,data){
 const predict=spectralCalibration(data.spectrum),active=q.diagnostic;
 const measurements=q.measurements??(active==='none'?[]:[active]);
 const has=name=>measurements.includes(name);let bestChi=Infinity;
 const seismicLogs={};if(has('seismic')){const x=[Math.log10(q.Dnu),Math.log10(q.numax),q.DPi1];if(inside(x,data.evidence.seismic.envelope))for(const key of ['1','2']){const v=density(x,data.seismic.groups[key]);if(v>0)seismicLogs[key]=Math.log(v)}}
 const rows=groups.map(g=>{
  let best=-Infinity,chosen=null,tested=0,total=g.solutions.length;
  for(const s of g.solutions){let log=0,chi=0;
   if(has('lithium')){
    const p=[-1,0].includes(g.phase)?lithiumPrediction(data.lithium,q.T,s.age,s.metallicity):null;
    if(!p)continue;const sigma=Math.hypot(p[1],5),residual=((q.lithium-p[0])/sigma)**2;chi+=residual;log+=-.5*residual-Math.log(sigma);
   }
   if(has('seismic')){
    if(![2,3,4,5].includes(g.phase))continue;
    const term=seismicLogs[g.phase===3?'2':'1'];if(term===undefined)continue;log+=term;
   }
   if(has('spectrum')){
    const p=[-1,0,2,3].includes(g.phase)?predict(q.T,spectralGravity(q.T,q.logL,s.mass),s.metallicity):null;
    if(p===null)continue;const residual=((q.wing-p)/.01)**2;chi+=residual;log+=-.5*residual;
   }
   tested++;bestChi=Math.min(bestChi,chi);if(log>best){best=log;chosen=s}
  }
  return{...g,log:best,chosen,tested,total,partial:tested<total,percent:null};
 });
 const valid=rows.filter(r=>r.tested),peak=Math.max(...valid.map(r=>r.log));
 // If all measured fits are extremely poor, do not turn tiny likelihoods into certainty.
 const physicalCount=Number(has('spectrum'))+Number(has('lithium'));
 const conflict=valid.length>0&&physicalCount>0&&bestChi>25*physicalCount;
 const sum=valid.reduce((n,r)=>n+Math.exp(r.log-peak),0);
 if(!conflict)for(const r of valid)r.percent=100*Math.exp(r.log-peak)/sum;
 rows.sort((a,b)=>(b.percent??-1)-(a.percent??-1)||a.phase-b.phase);
 return{rows,conflict,active,measurements,partial:rows.some(r=>r.partial),tied:rows.filter(r=>r.percent!==null&&Math.abs(r.percent-(rows[0]?.percent??0))<1e-8).length>1};
}
