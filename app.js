import{derived,phases}from './engine.js?v=22';
import{enhanceSliders}from './touch-sliders.js';
import{evidence}from './evidence.js';
import{rank}from './ranking.js?v=22';
import{decorateOscillations}from './oscillation-scale.js?v=22';
import{decorateLithium}from './lithium-scale.js?v=22';
import{decorateMagnesium}from './magnesium-scale.js?v=22';
import{observedMeasurements,randomIndex,compareReference,referenceIndicator}from './observed.js?v=24';
const $=id=>document.getElementById(id);
const initial={T:5772,logL:0,tolT:0,tolL:0,useSeismic:true,useTechnetium:true,Dnu:4.45,numax:46.5,DPi1:251.2,spacingError:3,tc4238:4238.15,tc4262:4262.28};
initial.measurements=[];initial.diagnostic='none';initial.lithium=100;initial.wing=.15;
let selected=null,ranking=null,scoreData=null;
let observedStar=null,observedEdited=false,observedCatalog=null;
let exampleCatalog=null,exampleMode=false;
let q={...initial},visual=derived(q),rgb=[255,245,225],plot=[],result=null,ready=false,calibration=null,phase=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
let modelReady=false,candidates=null,queryId=0,lastPoint='',pending=false;
const worker=new Worker('./candidate-worker.js?v=22',{type:'module'});
const fmt=(n,d=5)=>n.toLocaleString('en-US',{maximumSignificantDigits:d});
const fields=[
 ['T','Temperature','kelvin','controls',Math.log10(2500),Math.log10(50000),.0001],
 ['logL','Luminosity','solar luminosities','controls',-4,6,.001],
 ['lithium','Lithium absorption','milliangstroms','lithiumControls',0,400,1],
 ['wing','Magnesium absorption','flux index','spectrumControls',0,.7,.001],
 ['Dnu','Radial frequency spacing','microhertz','seismicControls',.1,30,.01],
 ['numax','Peak oscillation frequency','microhertz','seismicControls',1,300,.1],
 ['DPi1','Dipole period spacing','seconds','seismicControls',40,400,.1],
 ['spacingError','Period-spacing uncertainty','seconds','tcControls',0,25,.1],
 ['tc4238','Technetium blend near 4238','angstroms','tcControls',4237.95,4238.45,.0001],
 ['tc4262','Technetium blend near 4262','angstroms','tcControls',4261.95,4262.4,.0001]
];
fields.forEach(([id,label,unit,group,min,max,step])=>{
 const box=document.createElement('div');box.className='control';
 box.innerHTML='<div class="control-head"><label for="'+id+'Slider">'+label+'</label><output id="'+id+'"></output></div><input type="range" id="'+id+'Slider" aria-label="'+label+' slider" min="'+min+'" max="'+max+'" step="'+step+'" disabled>';
 $(group).append(box);$(id+'Slider').oninput=e=>{if(observedStar)observedEdited=true;q[id]=id==='T'?10**Number(e.target.value):id==='wing'?updateMagnesiumScale.decode(Number(e.target.value)):Number(e.target.value);apply()};
});
enhanceSliders();
const updateLithiumScale=decorateLithium($('lithiumSlider'));
const updateMagnesiumScale=decorateMagnesium($('wingSlider'));
const updateOscillationScales=decorateOscillations();
function requestCandidates(){
 if(!modelReady)return;
 const key=q.T+':'+q.logL;if(key===lastPoint)return;lastPoint=key;pending=true;candidates=null;
 worker.postMessage({type:'infer',id:++queryId,q:{T:q.T,logL:q.logL,allSolutions:true}});
}
worker.onmessage=({data:m})=>{
 if(m.type==='progress'){$('loading').textContent='Loading model candidates '+Math.round(m.done/m.total*100)+'%';}
 if(m.type==='ready'){modelReady=true;plot=m.plot;$('loading').hidden=true;requestCandidates();apply();}
 if(m.type==='result'&&m.id===queryId){candidates=m.result.groups;pending=false;renderEvidence();}
 if(m.type==='error'){$('loading').hidden=false;$('loading').textContent=m.message;$('verdict').textContent='Model candidates unavailable';}
};
worker.onerror=()=>{$('loading').hidden=false;$('loading').textContent='Model candidates could not load. Reload to retry.'};
function renderEvidence(){
 if(!calibration||!scoreData)return;result=evidence(q,calibration);
 $('candidateList').replaceChildren();
 const ids=new Set((candidates||[]).map(g=>g.phase));
 const ambiguous=(candidates||[]).length>1;
 const youth=ambiguous&&ids.has(-1)&&ids.has(0)&&q.T>=3000&&q.T<=6500;
 const giant=ambiguous&&ids.has(3)&&[2,4,5].some(p=>ids.has(p));
 const spectrum=ambiguous&&q.T>=3500&&q.T<=6500&&[-1,0,2,3].some(p=>ids.has(p));
 const allowed={none:true,lithium:youth,seismic:giant,spectrum};
 const enabled=new Set(q.measurements);
 for(const name of ['lithium','seismic','spectrum']){
   $(name+'Choice').hidden=!allowed[name]&&!enabled.has(name);
   $(name+'Choice').setAttribute('aria-pressed',String(enabled.has(name)));
   $(name+'Panel').hidden=!enabled.has(name);
   $(name+'Choice').disabled=Boolean(observedStar&&!observedMeasurements(observedStar).measurements.includes(name));
 }
 $('diagnosticOptions').hidden=!ambiguous&&!enabled.size;
 $('noneChoice').setAttribute('aria-pressed',String(!enabled.size));
 if(candidates===null){$('verdict').textContent='Checking this point…';$('evidenceNote').textContent='';renderObserved(true);return}
 if(enabled.has('spectrum'))updateMagnesiumScale(candidates,q,scoreData.spectrum);
 ranking=rank(candidates,q,scoreData);
 if(enabled.has('seismic'))updateOscillationScales(q,scoreData);
 if(enabled.has('seismic')&&!$('oscillationExamples')){const box=document.createElement('div');box.id='oscillationExamples';box.className='diagnostic-switches';for(const e of calibration.seismic.examples){const b=document.createElement('button');b.textContent=e.label===1?'Explore shell-burning measurements':'Explore helium-burning measurements';b.title=e.Dnu+' microhertz; '+e.numax+' microhertz; '+e.DPi1+' seconds';b.onclick=()=>{if(observedStar)observedEdited=true;q.Dnu=e.Dnu;q.numax=e.numax;q.DPi1=e.DPi1;apply()};box.append(b)}$('seismicPanel').append(box)}
 if(enabled.has('lithium'))updateLithiumScale(candidates,q,scoreData.lithium);
 $('verdict').textContent=!candidates.length?'No model match':ranking.conflict?'Measurement conflicts with models':'Overall relative fit';
 const names={lithium:'Lithium',spectrum:'Magnesium',seismic:'Oscillations'};
 $('evidenceNote').textContent=!enabled.size?'Temperature + luminosity · Equal starting weights.':'Temperature + luminosity + '+q.measurements.map(x=>names[x]).join(' + ')+(enabled.size>1?' · Combined fit; assumes independent measurement errors.':' · Relative fit, not calibrated probability.')+(ranking.partial?' Untested solutions remain possible.':'');
 $('guidanceTitle').textContent='Measurements included in overall fit';
 $('guidanceText').textContent='Enable one or more. Tap again to exclude.';
 $('actionNote').textContent=enabled.size?'Slider colors show each measurement alone. Results below combine all enabled measurements.':'';
 const top=ranking.rows[0]?.percent;
 for(const r of ranking.rows){
  const b=document.createElement('button');b.className='candidate result-card';
  const pct=r.percent===null?'Not scored':r.percent<.1?'<0.1%':r.percent>99.9&&ranking.rows.filter(x=>x.percent!==null).length>1?'>99.9%':r.percent.toFixed(1)+'%';
  const title=document.createElement('span');title.textContent=phases[r.phase]?.name||'Unspecified stage';
  const value=document.createElement('strong');value.textContent=pct;b.append(title,value);
  if(r===ranking.rows[0]){
   const indicator=referenceIndicator(observedStar,ranking,observedEdited);
   if(indicator){const badge=document.createElement('small');badge.className='catalog-indicator '+indicator.status;badge.textContent=indicator.symbol+' '+indicator.label;badge.title=indicator.detail;badge.setAttribute('aria-label',indicator.detail);b.append(badge)}
  }
  if(r.partial){const n=document.createElement('small');n.textContent='Some model solutions untested';b.append(n)}
  const example=r.chosen||r.solutions[0];b.disabled=!example;b.setAttribute('aria-pressed',String(selected===r.phase));
  b.setAttribute('aria-label',title.textContent+' '+pct+(r===ranking.rows[0]&&observedStar?' — '+referenceIndicator(observedStar,ranking,observedEdited).detail:'')+(b.disabled?'':' — inspect candidate'));
  b.onclick=()=>{selected=r.phase;for(const button of $('candidateList').children)button.setAttribute('aria-pressed',String(button===b));$('preview').hidden=false;$('readings').hidden=false;$('starStage').textContent=title.textContent;$('selectedMass').textContent=fmt(example.mass,3)+' solar masses ('+(r.chosen?'illustrative fit':'untested candidate example')+')';drawStar();$('preview').scrollIntoView({behavior:'smooth',block:'start'})};
  $('candidateList').append(b);
 }
 $('selectionNote').textContent=candidates.length?'Select any candidate to inspect it. Selection does not change its fit.':'';
 renderObserved();
}
for(const name of ['none','lithium','spectrum','seismic'])$(name+'Choice').onclick=()=>{if(observedStar)observedEdited=true;q.measurements=name==='none'?[]:q.measurements.includes(name)?q.measurements.filter(x=>x!==name):[...q.measurements,name];q.diagnostic=q.measurements.at(-1)||'none';apply()};
function apply(){selected=null;$('preview').hidden=true;$('readings').hidden=true;visual=derived(q);rgb=blackbody(q.T);$('actionNote').textContent='';
 fields.forEach(([id,label,unit])=>{const finite=Number.isFinite(q[id]);$(id+'Slider').disabled=!finite;$(id+'Slider').value=id==='T'?Math.log10(q.T):finite?q[id]:$(id+'Slider').min;$(id).textContent=finite?(id.startsWith('tc')?q[id].toFixed(4):fmt(id==='logL'?10**q.logL:q[id],6))+' '+unit:'Not recorded'});
 requestCandidates();renderEvidence();$('radius').textContent=fmt(visual.radius,3)+' solar radii';$('tempBadge').textContent=fmt(q.T,4)+' kelvin';drawHR();drawStar();
}
$('reset').onclick=()=>{observedStar=null;observedEdited=false;exampleMode=false;q={...initial,measurements:[]};setControlBounds();apply();$('observedPanel').hidden=true};
function setControlBounds(){
 for(const[id,, , ,min,max,step]of fields){if(id==='wing')continue;const slider=$(id+'Slider'),v=id==='T'?Math.log10(q.T):q[id],bounds=calibration?.seismic.bounds[id]||[min,max];slider.min=Number.isFinite(v)?Math.min(bounds[0],v):bounds[0];slider.max=Number.isFinite(v)?Math.max(bounds[1],v):bounds[1];slider.step=observedStar?'any':step}
}
function loadObservedStar(star,asExample=false){
 exampleMode=asExample;
 observedStar=star;observedEdited=false;q={...initial,...observedMeasurements(star),useTechnetium:false};
 if(asExample){const recorded=q.measurements;q.measurements=star.exampleSetup.measurements.filter(n=>recorded.includes(n));q.diagnostic=q.measurements.at(-1)||'none'}
 setControlBounds();apply();
}
function renderObserved(checking=false){
 $('observedPanel').hidden=!observedStar;if(!observedStar)return;
 const s=observedStar;$('observedName').textContent=(s.displayName||'Kepler Input Catalog '+s.id)+(exampleMode?' · Diagnostic example':'');
 $('sampleAuditLink').hidden=!exampleMode;$('sampleAuditLink').href='audit.html#star-'+encodeURIComponent(s.id);
 $('observedReference').textContent='Catalog: '+s.catalogClass+(s.stageReference?' · '+s.stageReference.label:'')+(s.spectralType?' · '+s.spectralType:'');
 $('observedComparison').textContent=observedEdited?'Exploration: measurements changed; no longer the recorded-star test.':checking?'Checking recorded data…':compareReference(s,ranking);
 const shown=(x,unit)=>Number.isFinite(x)?fmt(x,6)+' '+unit:'not recorded';
 const lines=[['Temperature',shown(s.T,'kelvin')],['Luminosity',shown(s.luminosity,'solar luminosities')],['Magnesium',shown(s.wing,'flux index')],['Lithium',shown(s.lithium,'milliangstroms')+(s.lithiumLimit?' (limit; excluded)':'')],['Radial spacing',shown(s.Dnu,'microhertz')],['Peak frequency',shown(s.numax,'microhertz')],['Period spacing',shown(s.DPi1,'seconds')+(s.oscillationAlias?' (alias flag; excluded)':'')]];
 $('observedMeasurements').replaceChildren();for(const[name,value]of lines){const row=document.createElement('p');row.textContent=name+': '+value;$('observedMeasurements').append(row)}
 $('observedCaution').textContent='Reference labels never enter the fit. Missing data are excluded; partial oscillation sets cannot enter the three-measurement calibration.'+(s.binaryFlag?' Catalog binary flag: '+s.binaryFlag+'.':'');
 if(exampleMode){$('observedCaution').textContent+=' '+s.exampleSetup.basis+(s.exampleSetup.otherRecordedDiagnostics.length?' Other recorded diagnostic sets are retained but not enabled for this example: '+s.exampleSetup.otherRecordedDiagnostics.join(', ')+'.':'')+' '+(s.measurementNotes||[]).join(' ')}
}
$('randomExample').onclick=async()=>{const b=$('randomExample');b.disabled=true;b.textContent='Loading examples…';try{
 if(!exampleCatalog){const r=await fetch('data/diagnostic-stars.json?v=22');if(!r.ok)throw Error('Example database could not load');exampleCatalog=await r.json()}
 loadObservedStar(exampleCatalog.stars[randomIndex(exampleCatalog.stars.length)],true);
 }catch(e){$('observedPanel').hidden=false;$('observedComparison').textContent=e.message}finally{b.textContent='Random diagnostic example';b.disabled=false}};
$('randomStar').onclick=async()=>{const button=$('randomStar');button.disabled=true;button.textContent='Loading…';try{
 if(!observedCatalog){const r=await fetch('data/observed-stars.json?v=22');if(!r.ok)throw Error('Catalog download failed');observedCatalog=await r.json()}
 loadObservedStar(observedCatalog.stars[randomIndex(observedCatalog.stars.length)]);
 }catch(e){$('observedPanel').hidden=false;$('observedComparison').textContent=e.message}finally{button.textContent='Random star';button.disabled=false}};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused))};
$('pause').textContent=paused?'Resume':'Pause';$('sizeMode').onchange=drawStar;
async function load(){try{
 const r=await fetch('data/evidence.json?v=22');if(!r.ok)throw Error('Evidence calibration could not load');calibration=await r.json();const extra=await Promise.all(['lithium-grid','spectral-index','seismic-density'].map(async n=>{const r=await fetch('data/'+n+'.json');if(!r.ok)throw Error('Ranking data unavailable');return r.json()}));scoreData={lithium:extra[0],spectrum:extra[1],seismic:extra[2],evidence:calibration};
 const bounds=calibration.seismic.bounds;for(const id of ['Dnu','numax','DPi1']){$(id+'Slider').min=bounds[id][0];$(id+'Slider').max=bounds[id][1]}
 fields.forEach(([id])=>$(id+'Slider').disabled=false);$('reset').disabled=false;$('randomStar').disabled=false;$('randomExample').disabled=false;ready=true;apply();
 }catch(e){$('loading').hidden=false;$('loading').textContent=e.message;}}
window.starLab={loadObservedStar,get observed(){return observedStar},get ready(){return ready},get modelReady(){return modelReady&&!pending&&candidates!==null},get state(){return {...q}},get result(){return result},get candidates(){return candidates},get ranking(){return ranking},get selected(){return selected},get physical(){return visual},get calibration(){return calibration}};
function blackbody(T){let X=0,Y=0,Z=0;for(let nm=380;nm<=780;nm+=5){const gauss=(mu,a,b)=>Math.exp(-.5*((nm-mu)*(nm<mu?a:b))**2),x=.362*gauss(442,.0624,.0374)+1.056*gauss(599.8,.0264,.0323)-.065*gauss(501.1,.049,.0382),y=.821*gauss(568.8,.0213,.0247)+.286*gauss(530.9,.0613,.0322),z=1.217*gauss(437,.0845,.0278)+.681*gauss(459,.0385,.0725),p=1/(nm**5*Math.expm1(1.438776877e7/(nm*T)));X+=p*x;Y+=p*y;Z+=p*z}X/=Y;Z/=Y;Y=1;let c=[3.2406*X-1.5372*Y-.4986*Z,-.9689*X+1.8758*Y+.0415*Z,.0557*X-.204*Y+1.057*Z],max=Math.max(...c);return c.map(v=>{v=Math.max(0,v/max);return Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055))})}
function context(id){const c=$(id),w=c.clientWidth,h=c.clientHeight,d=Math.min(devicePixelRatio||1,2);if(c.width!==Math.round(w*d)||c.height!==Math.round(h*d)){c.width=Math.round(w*d);c.height=Math.round(h*d)}const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);return{g,w,h}}
function drawStar(){if($('preview').hidden)return;const{g,w,h}=context('star'),linear=$('sizeMode').value==='linear',ratio=linear?visual.radius:visual.radius**.18,max=Math.min(w*.2,h*.29),unit=max/Math.max(ratio,1),r=Math.max(.6,unit*ratio),sun=Math.max(.6,unit),x=w*.67,y=h*.49,sx=w*.26;for(let i=0;i<95;i++){g.fillStyle='rgba(190,214,247,'+(.08+(i%4)*.045)+')';g.fillRect((Math.sin(i*83.2)*.5+.5)*w,(Math.cos(i*54.3)*.5+.5)*h,1,1)}const halo=g.createRadialGradient(x,y,r*.75,x,y,r*2);halo.addColorStop(0,'rgba('+rgb+','+(.16+.5*(q.logL+5)/12)+')');halo.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=halo;g.beginPath();g.arc(x,y,r*2,0,Math.PI*2);g.fill();g.save();g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.clip();const grad=g.createRadialGradient(x-r*.2,y-r*.25,0,x,y,r);grad.addColorStop(0,'rgb('+rgb+')');grad.addColorStop(.7,'rgb('+rgb.map(v=>Math.round(v*.84))+')');grad.addColorStop(1,'rgb('+rgb.map(v=>Math.round(v*.4))+')');g.fillStyle=grad;g.fillRect(x-r,y-r,2*r,2*r);for(let i=0;i<420;i++){const u=((i*.61803398875+phase*.004)%1)*2-1,v=Math.sin(i*17.7)*.97;if(u*u+v*v>.97)continue;g.fillStyle=i%3?'rgba(25,10,8,.07)':'rgba(255,255,240,.1)';g.beginPath();g.ellipse(x+u*r,y+v*r,Math.max(.3,r*.023*Math.sqrt(1-u*u)),Math.max(.3,r*.01),0,0,Math.PI*2);g.fill()}g.restore();g.strokeStyle='#a8b2bd';g.lineWidth=.8;g.setLineDash([2,3]);g.beginPath();g.arc(sx,y,sun,0,Math.PI*2);g.stroke();g.setLineDash([]);g.font='10px system-ui';g.textAlign='center';g.fillStyle='#96a7bc';g.fillText('Sun',sx,Math.min(h-62,y+sun+18));g.fillStyle='#d5e4f6';g.fillText('Illustrative star',x,Math.min(h-62,y+r+18));g.textAlign='left';}
function drawHR(){const{g,w,h}=context('hr'),left=47,right=w-17,top=15,bottom=h-33,px=t=>left+(Math.log10(50000)-t)/(Math.log10(50000)-Math.log10(2500))*(right-left),py=l=>bottom-(l+4)/10*(bottom-top);g.font='10px system-ui';for(let l=-4;l<=6;l++){const y=py(l);g.strokeStyle='#233148';g.beginPath();g.moveTo(left,y);g.lineTo(right,y);g.stroke();g.fillStyle='#859ab5';g.fillText('10^'+l,3,y+3)}g.save();g.beginPath();g.rect(left,top,right-left,bottom-top);g.clip();for(const p of plot){g.fillStyle=phases[Math.round(p[2])]?.color+'50';g.fillRect(px(p[0]),py(p[1]),1.3,1.3)}g.strokeStyle='#f4fcff';g.fillStyle='rgb('+rgb+')';g.beginPath();g.arc(px(Math.log10(q.T)),py(q.logL),4,0,Math.PI*2);g.fill();g.stroke();g.restore();for(const t of [40000,10000,3000]){g.textAlign=t===40000?'left':t===3000?'right':'center';g.fillStyle='#a1b3cb';g.fillText(t.toLocaleString()+' kelvin',px(Math.log10(t)),h-9)}g.textAlign='left';g.fillStyle='#aec8d3';g.font='9px system-ui';g.fillText('Solar luminosities',left,10)}
window.addEventListener('resize',()=>{drawStar();drawHR()});
let last=0;function animate(now){if(now-last>33){if(!paused&&!document.hidden){phase+=Math.min((now-last)/1000,.1);drawStar()}last=now}requestAnimationFrame(animate)}
drawHR();drawStar();requestAnimationFrame(animate);load();
