// Observed-star mode: integrate native isochrone cells rather than count grid points.
// Prior: constant formation rate (uniform LINEAR age), Kroupa initial-mass density,
// uniform initial metallicity over the tabulated range. No catalog labels enter here.
export function initialMassDensity(m){return m<.5?m**-1.3:.5*m**-2.3}
export function prepareObservedGrid(mesh){
 const a=mesh.a,weights=new Float64Array(a.length/9),ages=new Map();
 for(let i=0;i<a.length;i+=9){const key=Math.round(a[i+5]*1e5);if(!ages.has(key))ages.set(key,[]);ages.get(key).push(i)}
 const ordered=[...ages.values()].sort((x,y)=>a[x[0]+5]-a[y[0]+5]);
 for(let j=0;j<ordered.length;j++){
  const rows=ordered[j].sort((x,y)=>a[x+6]-a[y+6]),t=10**a[rows[0]+5];
  const lo=j?Math.sqrt(t*10**a[ordered[j-1][0]+5]):t,hi=j+1<ordered.length?Math.sqrt(t*10**a[ordered[j+1][0]+5]):t;
  const dt=hi-lo;
  for(let k=0;k<rows.length;k++){
   const i=rows[k],m=a[i+6],ml=k?(m+a[rows[k-1]+6])/2:m,mh=k+1<rows.length?(m+a[rows[k+1]+6])/2:m;
   weights[i/9]=Math.max(0,mh-ml)*dt*initialMassDensity(m)*(mesh.metallicityWidth||1);
  }
 }
 mesh.observedWeights=weights;return mesh;
}
export function observationErrors(star){
 if(!(star.temperatureError>0))return null;
 if(star.radius>0&&star.radiusErrorLower>0&&star.radiusErrorUpper>0)return {T:star.T,temperatureError:star.temperatureError,radius:star.radius,radiusErrorLower:star.radiusErrorLower,radiusErrorUpper:star.radiusErrorUpper,coordinate:'temperature-radius'};
 if(star.luminosityError>0)return {T:star.T,temperatureError:star.temperatureError,luminosity:star.luminosity,luminosityError:star.luminosityError,coordinate:'temperature-luminosity'};
 return null;
}
export function inferObserved(meshes,q){
 const e=q.observationErrors;if(!e)return null;
 const groups=new Map();let total=0,bestChi=Infinity;
 for(const mesh of meshes){
  if(!mesh.observedWeights)prepareObservedGrid(mesh);
  const a=mesh.a;
  for(let i=0;i<a.length;i+=9){
   const T=10**a[i],dt=(T-q.T)/e.temperatureError;if(Math.abs(dt)>5)continue;
   const L=10**a[i+1],R=Math.sqrt(L)*(5772/T)**2;
   const dr=e.coordinate==='temperature-radius'?(R-e.radius)/(R<e.radius?e.radiusErrorLower:e.radiusErrorUpper):(L-10**q.logL)/e.luminosityError;
   if(Math.abs(dr)>5)continue;
   const w=mesh.observedWeights[i/9];if(!(w>0))continue;
   const rho=e.correlation||0,chi=(dt*dt+dr*dr-2*rho*dt*dr)/(1-rho*rho);bestChi=Math.min(bestChi,chi);
   const phase=Math.round(a[i+7]);let g=groups.get(phase);
   if(!g){g={phase,mass:[Infinity,-Infinity],age:[Infinity,-Infinity],initialMass:[Infinity,-Infinity],solutions:[],count:0};groups.set(phase,g)}
   const s={phase,logT:a[i],logL:a[i+1],mass:a[i+4],age:a[i+5],initialMass:a[i+6],metallicity:mesh.metallicity,baseLogWeight:Math.log(w)-chi/2,positionChi:chi};
   g.solutions.push(s);g.count++;total++;
   for(const[key,value]of [['mass',s.mass],['age',s.age],['initialMass',s.initialMass]]){g[key][0]=Math.min(g[key][0],value);g[key][1]=Math.max(g[key][1],value)}
  }
 }
 return {groups:[...groups.values()],count:total,mode:'observed-uncertainty',bestChi};
}
