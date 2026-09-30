import {spectralGravity} from './spectral.js';
export function calibratedModels(a,predict){
 const models=[];
 for(let i=0;i<a.length;i+=9){
 const T=10**a[i],logL=a[i+1],mass=a[i+4],stage=a[i+7];
 if(![-1,0,2,3].includes(stage))continue;
 const wing=predict(T,spectralGravity(T,logL,mass),0);
 if(wing===null)continue;
 models.push({id:i/9,T,logL,wing,mass,stage,logAge:a[i+5]});
 }return models;
}
export const coordinates=m=>[Math.log10(m.T),m.logL,m.wing];
export function bounds(models){return [0,1,2].map(k=>{let lo=Infinity,hi=-Infinity;for(const m of models){const v=coordinates(m)[k];lo=Math.min(lo,v);hi=Math.max(hi,v)}return [lo,hi]})}
export function selectModel(models,target,ranges,edited=-1){
 let best=null,score=Infinity;
 for(const m of models){const c=coordinates(m);let s=0;for(let k=0;k<3;k++)s+=(k===edited?25:1)*((c[k]-target[k])/(ranges[k][1]-ranges[k][0]))**2;
 // Stable source-row order breaks exact ties; no phase or mass priority.
 if(s<score){best=m;score=s}}
 return best;
}
