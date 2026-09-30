import{seismicShares}from './ranking.js?v=19';
const names=['Dnu','numax','DPi1'];
export function oscillationScale(id,q,data,min,max){
 const at=x=>seismicShares({...q,[id]:x},data),crossings=[],stops=[];let previous=null;
 // Slice the coverage hull first so a narrow valid interval is not missed by
 // a coarse full-range scan. Frequencies are logarithmic inside the hull.
 const h=data.evidence.seismic.envelope,axis=names.indexOf(id),transform=x=>axis===2?x:Math.log10(x),inverse=x=>axis===2?x:10**x;
 const fixed=[Math.log10(q.Dnu),Math.log10(q.numax),q.DPi1].map((x,i)=>(x-h.offset[i])/h.scale[i]);
 let lo=(transform(min)-h.offset[axis])/h.scale[axis],hi=(transform(max)-h.offset[axis])/h.scale[axis];
 for(const p of h.planes){let rest=p.at(-1);for(let i=0;i<3;i++)if(i!==axis)rest+=p[i]*fixed[i];if(Math.abs(p[axis])<1e-14){if(rest>1e-8)lo=Infinity}else if(p[axis]>0)hi=Math.min(hi,-rest/p[axis]);else lo=Math.max(lo,-rest/p[axis])}
 const samples=[min,max];if(lo<=hi){const a=inverse(lo*h.scale[axis]+h.offset[axis]),b=inverse(hi*h.scale[axis]+h.offset[axis]);for(let i=0;i<=100;i++)samples.push(a+(b-a)*i/100);samples.push(Math.max(min,a-(max-min)*1e-6),Math.min(max,b+(max-min)*1e-6))}
 for(const x of [...new Set(samples)].sort((a,b)=>a-b)){const r=at(x);if(r&&previous&&((r.helium-.5)*(previous.r.helium-.5)<0)){let lo=previous.x,hi=x;for(let j=0;j<20;j++){const mid=(lo+hi)/2,m=at(mid);if(!m)break;if((at(lo).helium-.5)*(m.helium-.5)<=0)hi=mid;else lo=mid}crossings.push((lo+hi)/2)}
  const base=[65,72,85],color=r?(r.helium>=.5?[119,219,160]:[255,161,72]):base,strength=r?Math.abs(2*r.helium-1):0;stops.push('rgb('+base.map((n,j)=>Math.round(n+(color[j]-n)*strength))+') '+(x-min)/(max-min)*100+'%');previous=r?{r,x}:null;
 }
 return{at,crossings,gradient:'linear-gradient(to right,'+stops.join(',')+')'};
}
export function decorateOscillations(){
 const ui=names.map(id=>{const slider=document.getElementById(id+'Slider'),wrap=document.createElement('div');wrap.className='lithium-track-wrap';slider.before(wrap);wrap.append(slider);slider.classList.add('evidence-slider');
 const rail=document.createElement('div');rail.className='lithium-color-rail';wrap.prepend(rail);const marks=document.createElement('div');marks.className='lithium-marks';wrap.append(marks);const caption=document.createElement('div');caption.className='lithium-key';caption.id=id+'Key';slider.closest('.control').append(caption);slider.setAttribute('aria-describedby',caption.id);return{id,slider,rail,marks,caption,key:null,scale:null}});
 return(q,data)=>{for(const u of ui){const min=Number(u.slider.min),max=Number(u.slider.max),key=names.filter(id=>id!==u.id).map(id=>q[id]).join(':');
  if(key!==u.key){u.key=key;u.scale=oscillationScale(u.id,q,data,min,max);u.rail.style.background=u.scale.gradient;u.marks.replaceChildren();for(const x of u.scale.crossings){const mark=document.createElement('span');mark.className='lithium-crossover';mark.style.left=(x-min)/(max-min)*100+'%';mark.title='Equal oscillation-class fit at '+x.toFixed(2);u.marks.append(mark)}}
  const r=u.scale.at(q[u.id]);u.caption.replaceChildren();for(const[color,text]of [['#ffa148','Orange: shell-burning giants'],['#77dba0','Green: core helium burning']]){const label=document.createElement('span');label.style.color=color;label.textContent=text;u.caption.append(label)}
  const label=document.createElement('span');label.className='oscillation-crossing-label';label.style.width='100%';label.textContent=u.scale.crossings.length?'50 / 50 at '+u.scale.crossings.map(x=>x.toFixed(2)).join(', ')+(u.id==='DPi1'?' seconds':' microhertz'):'No crossover with the other oscillation values fixed';u.caption.append(label);
  const current=document.createElement('span');current.textContent=r?(r.helium>=.5?'Core helium burning':'Shell-burning giants')+' '+(Math.max(r.helium,r.shell)> .999?'>99.9':(100*Math.max(r.helium,r.shell)).toFixed(1))+'% oscillation-class fit':'Gray: outside oscillation calibration';u.caption.append(current);u.slider.setAttribute('aria-valuetext',q[u.id]+(u.id==='DPi1'?' seconds; ':' microhertz; ')+current.textContent);
 }};
}
