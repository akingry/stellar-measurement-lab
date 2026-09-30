import {seismic} from './evidence.js';
// Propose exploratory measurement changes, not an invented observed value.
export function spacingTarget(q,d,code){
 const lo=d.bounds.DPi1[0],hi=d.bounds.DPi1[1],hits=[];
 for(let p=lo;p<=hi;p+=.5){const candidate={...q,useSeismic:true,DPi1:p};const s=seismic(candidate,d);if(s.status==='supported'&&s.code===code)hits.push(p)}
 if(!hits.length)return null;
 // An interior point is less vulnerable to rounding at the hull boundary.
 return {Dnu:q.Dnu,numax:q.numax,DPi1:hits[Math.floor(hits.length/2)],spacingError:q.spacingError};
}
export function guide(q,groups,r,d){
 const ids=new Set(groups.map(g=>g.phase)), giant=[2,3,4,5].some(p=>ids.has(p));
 const notes=[],actions=[];
 if(!groups.length)return {title:'No model match here',notes:['Move temperature or luminosity toward the plotted tracks. No nearby star is silently substituted.'],actions:[{label:'Explore Sun-like point',values:{T:5772,logL:0}},{label:'Explore giant point',values:{T:4800,logL:Math.log10(50)}}]};
 if(ids.has(-1)&&ids.has(0))notes.push('At this point: a contracting young star or a main-sequence star. These giant-diagnostic sliders cannot separate them; lithium absorption and age-sensitive oscillation measurements need another calibration.');
 if(giant){
   if(ids.has(3)&&(ids.has(2)||ids.has(4)||ids.has(5))){
     notes.push('Higher dipole period spacing favors core helium burning; lower spacing favors shell burning, within the giant calibration. Keep radial spacing and peak frequency compatible.');
     for(const [code,label]of [[1,'Try shell-burning spacing'],[2,'Try helium-burning spacing']]){const values=spacingTarget(q,d.seismic,code);if(values)actions.push({label,values});}
     if(!actions.length){notes.push('This frequency pair has no supported spacing interval. Try a published measurement combination first.');for(const e of d.seismic.examples)actions.push({label:e.label===1?'Try shell-burning combination':'Try helium-burning combination',values:{Dnu:e.Dnu,numax:e.numax,DPi1:e.DPi1,spacingError:0}})}
   }
   if(ids.has(4)||ids.has(5)){
     notes.push('To move from a technetium-poor to rich pattern, decrease the 4238 blend wavelength and increase the 4262 blend wavelength together. That supports recent dredge-up, not a unique stage.');
     const a=d.technetium.groups['technetium-rich'].example,b=d.technetium.groups['technetium-poor'].example;
     actions.push({label:'Try technetium-rich pair',values:{tc4238:a[0],tc4262:a[1]}},{label:'Try technetium-poor pair',values:{tc4238:b[0],tc4262:b[1]}});
     notes.push('Technetium-poor does not mean early asymptotic giant. Early versus thermally pulsing stages need more evidence than these controls provide.');
   }
   if(r.seismic.status==='ambiguous')notes.push('The uncertainty interval crosses both estimates. Narrow it only to explore better precision—not to claim a better measurement.');
 }else if(!ids.has(-1)||!ids.has(0))notes.push('The present oscillation calibration is for giants, not this candidate family. Do not use these sliders to force its stage.');
 if(!giant)actions.push({label:'Explore giant point',values:{T:4800,logL:Math.log10(50)}});
 return {title:groups.length>1?'How to distinguish these':'What to measure next',notes,actions};
}
