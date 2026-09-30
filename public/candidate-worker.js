import{buildMesh,inferPoint}from './point-inference.js?v=12';
import{buildCooling,inferCooling}from './cooling.js';
const meshes=[];let ready=false,cooling=[];
onmessage=e=>{if(ready&&e.data.type==='infer'){const result=inferPoint(meshes,e.data.q);result.groups.push(...inferCooling(cooling,e.data.q));postMessage({type:'result',id:e.data.id,result})}};
async function load(){try{
 const mr=await fetch('./data/manifest.json');if(!mr.ok)throw Error('Model manifest unavailable');const manifest=await mr.json();let done=0;const plot=[];
 for(const f of manifest.files){
   const r=await fetch('./data/'+f.name);if(!r.ok)throw Error('Model data unavailable');const zipped=await r.arrayBuffer();
   const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',zipped))].map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==f.sha256)throw Error('Model checksum failed');
   const buf=await new Response(new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),a=new Float32Array(buf);if(a.length!==f.rows*9)throw Error('Model length mismatch');
   const mesh=buildMesh(a);mesh.metallicity=f.initial_feh;meshes.push(mesh);for(let i=0;i<a.length;i+=9*100)plot.push([a[i],a[i+1],a[i+7]]);
   done+=f.bytes;postMessage({type:'progress',done,total:manifest.total_bytes});
 }
 const cr=await fetch('./data/cooling-grid.json');if(!cr.ok)throw Error('Cooling grid unavailable');const cd=await cr.json();cooling=buildCooling(cd);for(const grid of cd.grids)for(const r of grid.rows)plot.push([r[0],r[1],10]);
 ready=true;postMessage({type:'ready',plot});
 }catch(e){postMessage({type:'error',message:e.message})}}
load();
