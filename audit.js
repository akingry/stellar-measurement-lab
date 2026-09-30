const $=id=>document.getElementById(id),el=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
const name=p=>({'-1':'Pre-main sequence',0:'Main sequence',2:'Post-main sequence / red giant branch',3:'Core helium burning',4:'Early asymptotic giant branch',5:'Thermally pulsing asymptotic giant branch',6:'Post-asymptotic giant branch / white dwarf cooling',10:'White-dwarf cooling'})[p]||String(p);
const topText=r=>r.rows.map(x=>x.name+': '+(x.percent===null?'not scored':x.percent.toFixed(2)+'%')).join('; ');
try{
 const response=await fetch('data/sample-audit.json?v=24');if(!response.ok)throw Error('Audit could not load');const data=await response.json();
 $('summary').textContent=data.counts.match+' consistent · '+data.counts.mismatch+' disagree · '+data.counts.neutral+' unresolved / not comparable';
 function render(filter){
  $('records').replaceChildren();for(const b of $('filters').children)b.setAttribute('aria-pressed',String(b.dataset.status===filter));
  const rows=data.records.filter(r=>filter==='all'||r.status===filter);$('shown').textContent=rows.length+' examples shown';
  for(const r of rows){
   const box=el('details','');box.className='audit-card';box.id='star-'+r.id;
   const top=r.prediction.rows[0],symbol=r.status==='match'?'✓':r.status==='mismatch'?'✕':'—';
   const summary=el('summary',symbol+' '+r.name+' · '+top.name);summary.className=r.status;box.append(summary);
   box.append(el('p','Catalog: '+r.reference+(r.referenceStage?' · '+r.referenceStage:'')),el('p','Production fit: '+topText(r.prediction)),el('p',r.comparison));
   box.append(el('h3','Why this result'));
   for(const reason of r.reasons)box.append(el('p',reason.text));
   if(r.improvements.length){box.append(el('h3','Improvement needed'));for(const item of r.improvements)box.append(el('p',item.action+' '+item.status+'. '+item.test));}
   const measurements=el('details','');measurements.append(el('summary','Recorded measurements and diagnostic tests'));
   const list=el('dl','');const units={temperature:'kelvin',luminosity:'solar luminosities',lithium:'milliangstroms',lithiumError:'milliangstroms',magnesium:'flux index',frequencySpacing:'microhertz',peakFrequency:'microhertz',periodSpacing:'seconds',periodSpacingError:'seconds'};
   const labels={temperature:'Temperature',luminosity:'Luminosity',lithium:'Lithium',lithiumError:'Lithium error',magnesium:'Magnesium',frequencySpacing:'Radial frequency spacing',peakFrequency:'Peak oscillation frequency',periodSpacing:'Period spacing',periodSpacingError:'Period-spacing error'};
   for(const[k,v]of Object.entries(r.measurements))list.append(el('dt',labels[k]),el('dd',v===null?'Not recorded':Number(v.toPrecision(6))+' '+units[k]));
   measurements.append(list,el('p','Enabled: '+(r.enabled.join(' + ')||'Temperature and luminosity only')));
   for(const test of r.diagnosticAblations)measurements.append(el('p',(test.measurements.join(' + ')||'Position only')+': '+topText(test)+' '+test.comparison));
   for(const fit of r.lithiumLikelihoodDetails)measurements.append(el('p',name(fit.phase)+' best lithium solution: predicted '+fit.predictedEquivalentWidth.toFixed(2)+' milliangstroms; combined scatter/error '+fit.combinedSigma.toFixed(2)+'; residual '+fit.standardizedResidual.toFixed(2)+' standard deviations; log likelihood '+fit.bestLogLikelihood.toFixed(3)+'.'));
   if(r.previousComparison!==r.comparison)measurements.append(el('p','Reporting correction: previously “'+r.previousComparison+'” The numerical prediction is unchanged.'));
   box.append(measurements);
   for(const[key,title]of [['uncertaintyExperiment','Uncertainty experiment'],['gravityExperiment','Additional spectroscopy experiment']]){
    const test=r[key];if(!test)continue;const details=el('details','');details.append(el('summary',title),el('p',test.method),el('p',topText(test)),el('p',test.comparison));
    if(test.observed)details.append(el('p','Spectrum-derived gravity: '+test.observed.logGravity+' ± '+test.observed.logGravityError+' (base-ten logarithm, centimeters per second squared).'));
    box.append(details);
   }
   if(r.sensitivity){box.append(el('p','Reference-compatible phase at central position: '+(r.sensitivity.referenceCoveredAtCenter?'yes':'no')+'. Within the one-error sampled temperature/radius box: '+(r.sensitivity.referenceCoveredWithinOneSigma?'yes':'no')+'. This scan is not a posterior probability.'));}
   $('records').append(box);
  }
 }
 for(const b of $('filters').children)b.onclick=()=>{history.replaceState(null,'',location.pathname);render(b.dataset.status)};
 const jump=()=>{render(location.hash?'all':'mismatch');if(location.hash){const box=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(box){box.open=true;box.scrollIntoView()}}};
 window.addEventListener('hashchange',jump);jump();
}catch(e){$('summary').textContent=e.message}
