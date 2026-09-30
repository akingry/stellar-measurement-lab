import {spectralGravity} from './spectral.js';
import {phases} from './engine.js';
// Piecewise-linear inverse interpolation on the native (log age, EEP) mesh.
// Each metallicity is a separate surface. Never connect different phases,
// missing EEPs, nonadjacent ages, or large jumps in the H–R plane.
const DX=.025,DY=.125,EPS=1e-7;
const cell=(x,y)=>Math.floor((x-2)/DX)+512*Math.floor((y+10)/DY);
export function buildMesh(a){
const byKey=new Map(),indices=[],buckets=new Map();let rejected=0;
for(let i=0;i<a.length;i+=9)byKey.set(Math.round(a[i+5]*20)*2048+Math.round(a[i+8]),i);
function add(i,j,k){
if(a[i+7]!==a[j+7]||a[i+7]!==a[k+7])return;
const xmin=Math.min(a[i],a[j],a[k]),xmax=Math.max(a[i],a[j],a[k]),ymin=Math.min(a[i+1],a[j+1],a[k+1]),ymax=Math.max(a[i+1],a[j+1],a[k+1]);
if(xmax-xmin>.05||ymax-ymin>.25){rejected++;return}
const det=(a[j]-a[i])*(a[k+1]-a[i+1])-(a[k]-a[i])*(a[j+1]-a[i+1]);if(Math.abs(det)<1e-14)return;
const n=indices.length;indices.push(i,j,k);
for(let x=Math.floor((xmin-2)/DX);x<=Math.floor((xmax-2)/DX);x++)for(let y=Math.floor((ymin+10)/DY);y<=Math.floor((ymax+10)/DY);y++){const key=x+512*y;let b=buckets.get(key);if(!b)buckets.set(key,b=[]);b.push(n)}
}
for(let i=0;i<a.length;i+=9){const key=Math.round(a[i+5]*20)*2048+Math.round(a[i+8]),j=byKey.get(key+1),k=byKey.get(key+2048),l=byKey.get(key+2049);if(j===undefined||k===undefined||l===undefined)continue;add(i,j,l);add(i,l,k)}
const bins=new Map();for(const[key,list]of buckets)bins.set(key,new Uint32Array(list));
// Preserve exact sampled points, including phase boundaries lacking triangles.
const vb=new Map();for(let i=0;i<a.length;i+=9){const key=cell(a[i],a[i+1]);let b=vb.get(key);if(!b)vb.set(key,b=[]);b.push(i)}
const vertices=new Map();for(const[key,list]of vb)vertices.set(key,new Uint32Array(list));
return{a,indices:new Uint32Array(indices),bins,vertices,triangles:indices.length/3,rejected};
}
export function inferPoint(meshes,q,predict=null){const x=Math.log10(q.T),y=q.logL,key=cell(x,y),groups={};let count=0,maxResidual=0,tested=0,excluded=0,untested=0;
function record(mesh,ids,w){const a=mesh.a,phase=Math.round(a[ids[0]+7]),v=col=>ids.reduce((sum,i,n)=>sum+w[n]*a[i+col],0),mass=v(4),age=v(5),initial=v(6),tx=v(0),ly=v(1);maxResidual=Math.max(maxResidual,Math.abs(tx-x),Math.abs(ly-y));let spectralUntested=false;
if(q.useSpectrum){
 const predicted=([-1,0,2,3].includes(phase)&&predict)?predict(q.T,spectralGravity(q.T,q.logL,mass),mesh.metallicity):null;
 if(predicted===null){untested++;spectralUntested=true}else{tested++;if(Math.abs(predicted-q.wing)>q.wingError){excluded++;return}}
}
const groupKey=phase+':'+spectralUntested;let p=groups[groupKey];if(!p)p=groups[groupKey]={phase,spectralUntested,count:0,mass:[Infinity,-Infinity],age:[Infinity,-Infinity],initialMass:[Infinity,-Infinity],solutions:[]};p.count++;p.mass[0]=Math.min(p.mass[0],mass);p.mass[1]=Math.max(p.mass[1],mass);p.age[0]=Math.min(p.age[0],age);p.age[1]=Math.max(p.age[1],age);p.initialMass[0]=Math.min(p.initialMass[0],initial);p.initialMass[1]=Math.max(p.initialMass[1],initial);count++;if(q.allSolutions||p.solutions.length<8)p.solutions.push({logT:tx,logL:ly,mass,age,initialMass:initial,phase,metallicity:mesh.metallicity})}
for(const mesh of meshes){const{a,indices,bins,vertices}=mesh;
for(const i of vertices.get(key)||[]){if(Math.abs(a[i]-x)<1e-10&&Math.abs(a[i+1]-y)<1e-10)record(mesh,[i],[1])}
for(const n of bins.get(key)||[]){const i=indices[n],j=indices[n+1],k=indices[n+2],ax=a[j]-a[i],ay=a[j+1]-a[i+1],bx=a[k]-a[i],by=a[k+1]-a[i+1],qx=x-a[i],qy=y-a[i+1],det=ax*by-bx*ay,u=(qx*by-bx*qy)/det,v=(ax*qy-qx*ay)/det,w=1-u-v;
if(u< -EPS||v< -EPS||w< -EPS||u>1+EPS||v>1+EPS||w>1+EPS)continue;
record(mesh,[i,j,k],[w,u,v]);
}}
return{groups:Object.values(groups).sort((a,b)=>a.phase-b.phase),count,spectral:{tested,excluded,untested},dims:q.useSpectrum?3:2,mode:'point-interpolation',maxResidual};}
