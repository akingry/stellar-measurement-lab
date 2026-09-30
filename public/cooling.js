// Separate, bounded Montreal grid. Do not relabel or split the MIST phase-6 flag.
export function buildCooling(data){
 const triangles=[];
 for(const grid of data.grids){
  const rows=grid.rows,ts=[...new Set(rows.map(r=>r[0]))].sort((a,b)=>a-b),gs=[...new Set(rows.map(r=>r[4]))].sort((a,b)=>a-b);
  const byKey=new Map(rows.map(r=>[r[0]+':'+r[4],r]));
  for(let t=0;t<ts.length-1;t++)for(let g=0;g<gs.length-1;g++){
   const a=byKey.get(ts[t]+':'+gs[g]),b=byKey.get(ts[t+1]+':'+gs[g]),c=byKey.get(ts[t]+':'+gs[g+1]),d=byKey.get(ts[t+1]+':'+gs[g+1]);
   if(!a||!b||!c||!d)continue;
   triangles.push({rows:[a,b,d],atmosphere:grid.atmosphere},{rows:[a,d,c],atmosphere:grid.atmosphere});
  }
 }
 return triangles;
}
export function inferCooling(triangles,q){
 const x=Math.log10(q.T),y=q.logL,solutions=[];
 for(const {rows:[a,b,c],atmosphere}of triangles){
  if(x<Math.min(a[0],b[0],c[0])-1e-10||x>Math.max(a[0],b[0],c[0])+1e-10||y<Math.min(a[1],b[1],c[1])-1e-10||y>Math.max(a[1],b[1],c[1])+1e-10)continue;
  const ax=b[0]-a[0],ay=b[1]-a[1],bx=c[0]-a[0],by=c[1]-a[1],dx=x-a[0],dy=y-a[1],det=ax*by-bx*ay;
  if(Math.abs(det)<1e-15)continue;
  const u=(dx*by-bx*dy)/det,v=(ax*dy-dx*ay)/det,w=1-u-v;
  if([u,v,w].some(n=>n< -1e-9||n>1+1e-9))continue;
  const interpolate=k=>a[k]*w+b[k]*u+c[k]*v;
  const coolingAge=[a[3],b[3],c[3]].every(Number.isFinite)?interpolate(3):null;
  solutions.push({phase:10,logT:x,logL:y,mass:interpolate(2),age:null,coolingLogAge:coolingAge,initialMass:null,metallicity:null,atmosphere});
 }
 if(!solutions.length)return[];
 return[{phase:10,count:solutions.length,solutions,mass:[Math.min(...solutions.map(s=>s.mass)),Math.max(...solutions.map(s=>s.mass))],age:[null,null],initialMass:[null,null],source:'Montreal cooling grid'}];
}
