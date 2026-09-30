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
 const minimum=0,maximum=.7;
 const anchors=[{x:0,p:0},...crossings.filter(x=>x>0&&x<.7).map((x,i)=>({x,p:crossings.length===1?.5:.15+.7*i/(crossings.length-1)})),{x:.7,p:1}];
 // Preserve the full physical domain. Expand winner transitions and peak fits,
 // never alter a likelihood or substitute display coordinates for measurements.
 const candidates=new Set([0,.7,...points.map(v=>v.v)]);
 for(const m of models){const v=[...m.values].sort((a,b)=>a-b);for(let i=1;i<v.length;i++)candidates.add((v[i-1]+v[i])/2)}
 const peaks={};for(const x of candidates){if(x<0||x>.7)continue;for(const r of at(x)||[])if(!peaks[r.phase]||r.percent>peaks[r.phase].percent)peaks[r.phase]={x,percent:r.percent}}
 for(const peak of Object.values(peaks)){if(anchors.some(a=>Math.abs(a.x-peak.x)<1e-8))continue;const i=anchors.findIndex(a=>a.x>peak.x);if(i>0)anchors.splice(i,0,{x:peak.x,p:(anchors[i-1].p+anchors[i].p)/2})}
 function interpolate(value,input,output){value=Math.max(anchors[0][input],Math.min(anchors.at(-1)[input],value));let i=anchors.findIndex(a=>a[input]>=value);if(i===0)return anchors[0][output];const a=anchors[i-1],b=anchors[i],w=(value-a[input])/(b[input]-a[input]);return a[output]+w*(b[output]-a[output])}
 const toValue=p=>interpolate(p,'p','x'),toPosition=x=>interpolate(x,'x','p');
 const stops=[];let first=null,last=null;for(let i=0;i<=700;i++){const x=toValue(i/700),rows=at(x),base=[83,91,105];if(rows){first??=rows[0];last=rows[0];const lead=(rows[0].percent-(rows[1]?.percent||0))/100,strength=lead<1e-10?0:.45+.55*lead,target=palette[rows[0].phase];stops.push('rgb('+base.map((n,j)=>Math.round(n+(target[j]-n)*strength))+') '+i/7+'%')}else stops.push('rgb(45,49,57) '+i/7+'%')}
 if(!first)return null;
 return{at,crossings,models,first,last,minimum,maximum,anchors,peaks,toValue,toPosition,gradient:'linear-gradient(to right,'+stops.join(',')+')'};
}
export function decorateMagnesium(slider){
 const wrap=document.createElement('div');wrap.className='lithium-track-wrap';slider.before(wrap);wrap.append(slider);
 const rail=document.createElement('div');rail.className='lithium-color-rail';wrap.prepend(rail);
 const marks=document.createElement('div');marks.className='lithium-marks';wrap.append(marks);
 const caption=document.createElement('div');caption.className='lithium-key';caption.id='magnesiumKey';slider.closest('.control').append(caption);slider.setAttribute('aria-describedby',caption.id);
 let previous=null,key='',scale=null;
 const update=(groups,q,data)=>{const next=q.T+':'+q.logL;
  if(previous!==groups||key!==next){previous=groups;key=next;scale=magnesiumScale(groups,q,data);marks.replaceChildren();rail.style.background=scale?.gradient||'repeating-linear-gradient(135deg,#515968 0 5px,#202938 5px 10px)';rail.dataset.coverage=scale?'supported':'unavailable';slider.min=0;slider.max=1000;slider.step=.1;for(const value of scale?.crossings||[]){const mark=document.createElement('span');mark.className='lithium-crossover';mark.style.left=scale.toPosition(value)*100+'%';mark.title='Leading fits tie at '+value.toFixed(4);marks.append(mark)}}
  slider.value=scale?scale.toPosition(q.wing)*1000:q.wing/.7*1000;document.getElementById('wing').textContent=q.wing.toLocaleString('en-US',{maximumSignificantDigits:6})+' flux index';
  caption.replaceChildren();if(!scale){caption.textContent='Striped: no magnesium calibration for these temperature/luminosity candidates. Moving absorption cannot resolve this.';slider.style.setProperty('--magnesium-thumb','#a8bbd2');slider.setAttribute('aria-valuetext',q.wing+' flux index; magnesium calibration unavailable');return}
  for(const g of scale.models){const label=document.createElement('span');label.style.color='rgb('+palette[g.phase]+')';label.textContent=({'-1':'Orange',0:'Blue',2:'Pink',3:'Green'}[g.phase])+': '+phases[g.phase].name;caption.append(label)}
  const direction=document.createElement('span');direction.style.width='100%';direction.textContent='Nonlinear scale';caption.append(direction);
  const marker=document.createElement('span');marker.className='magnesium-crossing-label';marker.style.width='100%';marker.textContent=scale.crossings.length?'Leading-fit crossover: '+scale.crossings.map(v=>v.toFixed(4)).join(', ')+' flux index':'No leading-fit crossover in range';caption.append(marker);
  const rows=scale.at(q.wing),current=document.createElement('span');current.textContent=rows?phases[rows[0].phase].name+' '+(rows[0].percent>99.9?'>99.9':rows[0].percent.toFixed(1))+'% fit':'Gray: measurement conflicts with calibrated models';caption.append(current);slider.style.setProperty('--magnesium-thumb',rows?'rgb('+palette[rows[0].phase]+')':'#a8bbd2');slider.setAttribute('aria-valuetext',q.wing+' flux index; '+current.textContent);
 };
 update.decode=value=>scale?scale.toValue(value/1000):value/1000*.7;
 return update;
}
