// Empirical diagnostics, not a universal or joint stellar-evolution fit.
export function inside(x,h){
 if(!x.every(Number.isFinite))return false;
 const v=x.map((n,i)=>(n-h.offset[i])/h.scale[i]);
 return h.planes.every(p=>p.slice(0,-1).reduce((s,n,i)=>s+n*v[i],p.at(-1))<=1e-8);
}
export function seismic(q,d){
 if(!q.useSeismic)return {status:'off',label:'Oscillations not supplied'};
 const x=[q.Dnu,q.numax,q.DPi1], e=q.spacingError;
 if(!x.every(n=>Number.isFinite(n)&&n>0)||!Number.isFinite(e)||e<0)return {status:'outside',label:'Outside oscillation calibration'};
 // Check the selected point and the whole period-spacing interval.
 const vectors=[-e,0,e].map(delta=>[Math.log10(x[0]),Math.log10(x[1]),x[2]+delta]);
 if(!vectors.every(v=>inside(v,d.envelope)))return {status:'outside',label:'Outside oscillation calibration'};
 const predict=a=>{let i=0;while(d.tree.left[i]>=0)i=a[d.tree.feature[i]]<=d.tree.threshold[i]?d.tree.left[i]:d.tree.right[i];return d.tree.label[i]};
 const labels=[-e,0,e].map(delta=>predict([x[0],x[1],x[2]+delta]));
 if(new Set(labels).size>1)return {status:'ambiguous',label:'Oscillation evidence overlaps'};
 const code=labels[0];return {status:'supported',code,label:d.labels[code],qualifier:code===2?'Catalog estimate':'Red or asymptotic giant — unresolved'};
}
export function technetium(q,d){
 if(!q.useTechnetium)return {status:'off',label:'Technetium not supplied'};
 const groups=Object.entries(d.groups).filter(([,g])=>inside([q.tc4238,q.tc4262],g.envelope));
 if(groups.length!==1)return {status:'outside',label:'Outside spectral calibration'};
 const rich=groups[0][0]==='technetium-rich';
 return {status:'supported',rich,label:rich?'Technetium-rich pattern':'Technetium-poor pattern',qualifier:rich?'Supports recent dredge-up':'Does not exclude thermal pulses'};
}
export function evidence(q,d){return {seismic:seismic(q,d.seismic),technetium:technetium(q,d.technetium)}};
