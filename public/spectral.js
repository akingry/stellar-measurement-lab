// Forward prediction of a measured flux index, not a line-width-to-mass law.
export function spectralCalibration(data){
 const rows=new Map(data.rows.map(r=>[[r.temperature,r.gravity,r.metallicity].join(','),r.index]));
 const axis=k=>[...new Set(data.rows.map(r=>r[k]))].sort((a,b)=>a-b);
 const tt=axis('temperature'),gg=axis('gravity'),zz=axis('metallicity');
 function bracket(a,x){if(!Number.isFinite(x)||x<a[0]||x>a.at(-1))return null;const hi=a.find(v=>v>=x);if(hi===x)return[[hi,1]];const lo=a[a.indexOf(hi)-1],w=(x-lo)/(hi-lo);return[[lo,1-w],[hi,w]]}
 return (t,g,z)=>{const a=bracket(tt,t),b=bracket(gg,g),c=bracket(zz,z);if(!a||!b||!c)return null;let sum=0;for(const[T,wt]of a)for(const[G,wg]of b)for(const[Z,wz]of c){const v=rows.get([T,G,Z].join(','));if(v===undefined)return null;sum+=v*wt*wg*wz}return sum};
}
export function spectralGravity(T,logL,mass){
 const radiusMeters=Math.sqrt(10**logL*3.828e26/(4*Math.PI*5.670374419e-8*T**4));
 return Math.log10(100*6.67430e-11*mass*1.98847e30/radiusMeters**2);
}
