import{lithiumPrediction}from './ranking.js?v=21';
export function lithiumScale(groups,q,data){
 const models=[-1,0].map(phase=>groups.filter(g=>g.phase===phase).flatMap(g=>g.solutions).map(s=>lithiumPrediction(data,q.T,s.age,s.metallicity)).filter(Boolean));
 if(models.some(m=>!m.length))return null;
 const share=x=>{const logs=models.map(m=>Math.max(...m.map(([mu,s])=>{const sigma=Math.hypot(s,Number.isFinite(q.lithiumError)?q.lithiumError:5);return -.5*((x-mu)/sigma)**2-Math.log(sigma)})));return 1/(1+Math.exp(logs[1]-logs[0]))};
 const crossings=[];let last=share(0)-.5;
 for(let x=1;x<=400;x++){const now=share(x)-.5;if(now*last<0||now===0){let lo=x-1,hi=x;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if((share(lo)-.5)*(share(mid)-.5)<=0)hi=mid;else lo=mid}crossings.push((lo+hi)/2)}last=now}
 const stops=[];for(let x=0;x<=400;x+=2){const p=share(x),strength=Math.abs(2*p-1),base=[83,91,105],target=p>=.5?[255,161,72]:[74,177,255];const rgb=base.map((n,i)=>Math.round(n+(target[i]-n)*strength));stops.push('rgb('+rgb.join(',')+') '+x/4+'%')}
 return{crossings,gradient:'linear-gradient(to right,'+stops.join(',')+')',share};
}
export function decorateLithium(slider){
 const wrap=document.createElement('div');wrap.className='lithium-track-wrap';slider.before(wrap);wrap.append(slider);
 const rail=document.createElement('div');rail.className='lithium-color-rail';wrap.prepend(rail);
 const marks=document.createElement('div');marks.className='lithium-marks';wrap.append(marks);
 const caption=document.createElement('div');caption.className='lithium-key';slider.closest('.control').append(caption);
 slider.setAttribute('aria-describedby','lithiumKey');caption.id='lithiumKey';
 let previous=null,temperature=null,uncertainty=null,scale=null;
 return(groups,q,data)=>{
  if(groups!==previous||temperature!==q.T||uncertainty!==q.lithiumError){previous=groups;temperature=q.T;uncertainty=q.lithiumError;scale=groups?lithiumScale(groups,q,data):null;
   marks.replaceChildren();rail.style.background=scale?.gradient||'#535b69';
   for(const value of scale?.crossings||[]){const mark=document.createElement('span');mark.className='lithium-crossover';mark.style.left=value/4+'%';mark.title='Equal fit at '+value.toFixed(1)+' milliangstroms';marks.append(mark)}
  }
  if(!scale){caption.textContent='No calibrated crossover';slider.removeAttribute('aria-valuetext');return}
  const p=scale.share(q.lithium),name=p>=.5?'Pre-main sequence':'Main sequence';
  caption.replaceChildren();
  const left=document.createElement('span');left.className='lithium-main';left.textContent='Blue: main sequence';
  const right=document.createElement('span');right.className='lithium-young';right.textContent='Orange: pre-main sequence';
  const middle=document.createElement('span');middle.className='lithium-crossing-label';middle.textContent=scale.crossings.length?'50 / 50 at '+scale.crossings.map(x=>x.toFixed(1)).join(', ')+' milliangstroms':'No 50 / 50 crossing in range';
  const percentage=100*Math.max(p,1-p),shown=percentage>99.9?'>99.9':percentage.toFixed(1);
  const current=document.createElement('span');current.textContent=name+' '+shown+'% fit';
  caption.append(left,right,middle,current);
  slider.setAttribute('aria-valuetext',q.lithium+' milliangstroms; '+name+' '+shown+' percent relative fit');
 };
}
