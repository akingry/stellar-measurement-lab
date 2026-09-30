import{spectralCalibration,spectralGravity}from './spectral.js';
import{phases}from './engine.js';
const palette={'-1':[255,161,72],0:[74,177,255],2:[238,116,169],3:[119,219,160]};
export function magnesiumScale(groups,q,data){
 const predict=spectralCalibration(data),models=groups.filter(g=>[-1,0,2,3].includes(g.phase)).map(g=>({phase:g.phase,values:g.solutions.map(s=>predict(q.T,spectralGravity(q.T,q.logL,s.mass),s.metallicity)).filter(v=>v!==null)})).filter(g=>g.values.length);
 if(!models.length)return null;
 const at=x=>{const rows=models.map(g=>({phase:g.phase,log:Math.max(...g.values.map(v=>-.5*((x-v)/.01)**2))})).sort((a,b)=>b.log-a.log||a.phase-b.phase),max=rows[0].log;if(max< -12.5)return null;const sum=rows.reduce((s,r)=>s+Math.exp(r.log-max),0);for(const r of rows)r.percent=100*Math.exp(r.log-max)/sum;return rows};
 // Equal-variance Gaussian profile likelihood: nearest predicted index wins.
 // All winner transitions occur between adjacent sorted forward predictions.
 const points=models.flatMap(g=>g.values.map(v=>({v,phase:g.phase}))).sort((a,b)=>a.v-b.v),crossings=[];
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],x=(a.v+b.v)/2;if(a.phase===b.phase||a.v===b.v||x<0||x>.7||!at(x))continue;if(!crossings.some(v=>Math.abs(v-x)<1e-8))crossings.push(x)}
 const stops=[];let first=null,last=null;for(let i=0;i<=700;i++){const x=i/1000,rows=at(x),base=[83,91,105];if(rows){first??=rows[0];last=rows[0];const strength=(rows[0].percent-(rows[1]?.percent||0))/100,target=palette[rows[0].phase];stops.push('rgb('+base.map((n,j)=>Math.round(n+(target[j]-n)*strength))+') '+i/7+'%')}else stops.push('rgb(45,49,57) '+i/7+'%')}
 if(!first)return null;
 return{at,crossings,models,first,last,gradient:'linear-gradient(to right,'+stops.join(',')+')'};
}
export function decorateMagnesium(slider){
 const wrap=document.createElement('div');wrap.className='lithium-track-wrap';slider.before(wrap);wrap.append(slider);
 const rail=document.createElement('div');rail.className='lithium-color-rail';wrap.prepend(rail);
 const marks=document.createElement('div');marks.className='lithium-marks';wrap.append(marks);
 const caption=document.createElement('div');caption.className='lithium-key';caption.id='magnesiumKey';slider.closest('.control').append(caption);slider.setAttribute('aria-describedby',caption.id);
 let previous=null,key='',scale=null;
 return(groups,q,data)=>{const next=q.T+':'+q.logL;
  if(previous!==groups||key!==next){previous=groups;key=next;scale=magnesiumScale(groups,q,data);marks.replaceChildren();rail.style.background=scale?.gradient||'#2d3139';for(const value of scale?.crossings||[]){const mark=document.createElement('span');mark.className='lithium-crossover';mark.style.left=value/.7*100+'%';mark.title='Leading fits tie at '+value.toFixed(4);marks.append(mark)}}
  caption.replaceChildren();if(!scale){caption.textContent='No calibrated magnesium comparison';slider.removeAttribute('aria-valuetext');return}
  for(const g of scale.models){const label=document.createElement('span');label.style.color='rgb('+palette[g.phase]+')';label.textContent=({'-1':'Orange',0:'Blue',2:'Pink',3:'Green'}[g.phase])+': '+phases[g.phase].name;caption.append(label)}
  const direction=document.createElement('span');direction.style.width='100%';direction.textContent=scale.crossings.length>1?'Several lead changes across the slider':'Lower: '+phases[scale.first.phase].name+' · Higher: '+phases[scale.last.phase].name;caption.append(direction);
  const marker=document.createElement('span');marker.className='magnesium-crossing-label';marker.style.width='100%';marker.textContent=scale.crossings.length?'Leading-fit crossover: '+scale.crossings.map(v=>v.toFixed(4)).join(', ')+' flux index':'No leading-fit crossover in range';caption.append(marker);
  const rows=scale.at(q.wing),current=document.createElement('span');current.textContent=rows?phases[rows[0].phase].name+' '+(rows[0].percent>99.9?'>99.9':rows[0].percent.toFixed(1))+'% fit · stronger color = stronger lead':'Gray: measurement conflicts with calibrated models';caption.append(current);slider.setAttribute('aria-valuetext',q.wing+' flux index; '+current.textContent);
 };
}
