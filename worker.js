import{infer}from './engine.js';
let chunks=[],ready=false;
async function load(){try{const mr=await fetch('./data/manifest.json');if(!mr.ok)throw Error('Model manifest could not load');const manifest=await mr.json();let done=0;const plot=[];
for(const f of manifest.files){const r=await fetch('./data/'+f.name);if(!r.ok)throw Error('A model file could not load');const zipped=await r.arrayBuffer();if(crypto.subtle){const hash=await crypto.subtle.digest('SHA-256',zipped),hex=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');if(hex!==f.sha256)throw Error('Model data integrity check failed')}
const stream=new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'));const buf=await new Response(stream).arrayBuffer(),a=new Float32Array(buf);if(a.length!==f.rows*9)throw Error('Model data length mismatch');chunks.push(a);done+=f.bytes;for(let i=0;i<a.length;i+=9*100)plot.push([a[i],a[i+1],a[i+7]]);postMessage({type:'progress',done,total:manifest.total_bytes,files:chunks.length})}
ready=true;postMessage({type:'ready',manifest,plot});}catch(e){postMessage({type:'error',message:e.message})}}
onmessage=e=>{if(e.data.type==='infer'&&ready){const start=performance.now(),result=infer(chunks,e.data.q);postMessage({type:'result',id:e.data.id,result,ms:performance.now()-start})}};load();
