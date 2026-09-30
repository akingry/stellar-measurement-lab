import{derived,phases}from './engine.js';
import{enhanceSliders}from './touch-sliders.js';
import{evidence}from './evidence.js';
const $=id=>document.getElementById(id);
let q={T:5772,logL:0,tolT:0,tolL:0,useSeismic:false,useTechnetium:false,Dnu:4.45,numax:46.5,DPi1:251.2,spacingError:3,tc4238:4238.15,tc4262:4262.28},visual=derived(q),rgb=[255,245,225],plot=[],result=null,ready=false,calibration=null,phase=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=(n,d=5)=>n.toLocaleString('en-US',{maximumSignificantDigits:d});
const fields=[
 ['T','Temperature','kelvin','controls',Math.log10(2500),Math.log10(50000),.0001],
 ['logL','Luminosity','solar luminosities','controls',-4,6,.001],
 ['Dnu','Radial frequency spacing','microhertz','seismicControls',.1,30,.01],
 ['numax','Peak oscillation frequency','microhertz','seismicControls',1,300,.1],
 ['DPi1','Dipole period spacing','seconds','seismicControls',40,400,.1],
 ['spacingError','Period-spacing uncertainty','seconds','seismicControls',0,25,.1],
 ['tc4238','Technetium blend near 4238','angstroms','tcControls',4237.95,4238.45,.0001],
 ['tc4262','Technetium blend near 4262','angstroms','tcControls',4261.95,4262.4,.0001]
];
fields.forEach(([id,label,unit,group,min,max,step])=>{
 const box=document.createElement('div');box.className='control';
 box.innerHTML='<div class="control-head"><label for="'+id+'Slider">'+label+'</label><output id="'+id+'"></output></div><input type="range" id="'+id+'Slider" aria-label="'+label+' slider" min="'+min+'" max="'+max+'" step="'+step+'" disabled>';
 $(group).append(box);$(id+'Slider').oninput=e=>{q[id]=id==='T'?10**Number(e.target.value):Number(e.target.value);apply()};
});
enhanceSliders();
function toggle(id,key,group){$(id).onclick=()=>{q[key]=!q[key];$(id).setAttribute('aria-pressed',String(q[key]));$(group).hidden=!q[key];apply()}}
toggle('seismicToggle','useSeismic','seismicControls');toggle('tcToggle','useTechnetium','tcControls');
function apply(){visual=derived(q);rgb=blackbody(q.T);
 fields.forEach(([id,label,unit])=>{$(id+'Slider').value=id==='T'?Math.log10(q.T):q[id];$(id).textContent=(id.startsWith('tc')?q[id].toFixed(4):fmt(id==='logL'?10**q.logL:q[id],6))+' '+unit});
 if(calibration){result=evidence(q,calibration);const s=result.seismic,t=result.technetium;
 $('verdict').textContent=s.status==='off'?'Stage not determined':s.label;
 $('evidenceNote').textContent=s.status==='supported'?s.qualifier:'No forced classification';
 $('tcResult').hidden=!q.useTechnetium;$('tcResult').textContent=t.label+(t.qualifier?' · '+t.qualifier:'');
 }
 $('radius').textContent=fmt(visual.radius,3)+' solar radii';$('tempBadge').textContent=fmt(q.T,4)+' kelvin';drawHR();drawStar();
}
$('reset').onclick=()=>{q={...q,T:5772,logL:0,useSeismic:false,useTechnetium:false,Dnu:4.45,numax:46.5,DPi1:251.2,spacingError:3,tc4238:4238.15,tc4262:4262.28};for(const [id,g] of [['seismicToggle','seismicControls'],['tcToggle','tcControls']]){$(id).setAttribute('aria-pressed','false');$(g).hidden=true}apply()};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused))};
$('pause').textContent=paused?'Resume':'Pause';$('sizeMode').onchange=drawStar;
async function load(){try{
 calibration=await(await fetch('data/evidence.json?v=10')).json();
 const b=calibration.seismic.bounds;for(const id of ['Dnu','numax','DPi1']){$(id+'Slider').min=b[id][0];$(id+'Slider').max=b[id][1]}
 fields.forEach(([id])=>$(id+'Slider').disabled=false);for(const id of ['reset','seismicToggle','tcToggle'])$(id).disabled=false;
 $('loading').hidden=true;ready=true;apply();
 // Evolutionary tracks provide visual context, not a fit to the diagnostics.
 const manifest=await(await fetch('data/manifest.json')).json(),file=manifest.files.find(f=>f.initial_feh===0);
 const response=await fetch('data/'+file.name);if(!response.ok)throw Error('Background tracks unavailable');
 const zipped=await response.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',zipped)),v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!==file.sha256)throw Error('Background checksum failed');
 const a=new Float32Array(await new Response(new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
 for(let i=0;i<a.length;i+=9*12)plot.push([a[i],a[i+1],a[i+7]]);drawHR();
 }catch(e){$('loading').hidden=false;$('loading').textContent=String(e.message);}}
window.starLab={get ready(){return ready},get state(){return {...q}},get result(){return result},get physical(){return visual},get calibration(){return calibration}};
function blackbody(T){let X=0,Y=0,Z=0;for(let nm=380;nm<=780;nm+=5){const gauss=(mu,a,b)=>Math.exp(-.5*((nm-mu)*(nm<mu?a:b))**2),x=.362*gauss(442,.0624,.0374)+1.056*gauss(599.8,.0264,.0323)-.065*gauss(501.1,.049,.0382),y=.821*gauss(568.8,.0213,.0247)+.286*gauss(530.9,.0613,.0322),z=1.217*gauss(437,.0845,.0278)+.681*gauss(459,.0385,.0725),p=1/(nm**5*Math.expm1(1.438776877e7/(nm*T)));X+=p*x;Y+=p*y;Z+=p*z}X/=Y;Z/=Y;Y=1;let c=[3.2406*X-1.5372*Y-.4986*Z,-.9689*X+1.8758*Y+.0415*Z,.0557*X-.204*Y+1.057*Z],max=Math.max(...c);return c.map(v=>{v=Math.max(0,v/max);return Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055))})}
function context(id){const c=$(id),w=c.clientWidth,h=c.clientHeight,d=Math.min(devicePixelRatio||1,2);if(c.width!==Math.round(w*d)||c.height!==Math.round(h*d)){c.width=Math.round(w*d);c.height=Math.round(h*d)}const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);return{g,w,h}}
function drawStar(){const{g,w,h}=context('star'),linear=$('sizeMode').value==='linear',ratio=linear?visual.radius:visual.radius**.18,max=Math.min(w*.2,h*.29),unit=max/Math.max(ratio,1),r=Math.max(.6,unit*ratio),sun=Math.max(.6,unit),x=w*.67,y=h*.49,sx=w*.26;for(let i=0;i<95;i++){g.fillStyle='rgba(190,214,247,'+(.08+(i%4)*.045)+')';g.fillRect((Math.sin(i*83.2)*.5+.5)*w,(Math.cos(i*54.3)*.5+.5)*h,1,1)}const halo=g.createRadialGradient(x,y,r*.75,x,y,r*2);halo.addColorStop(0,'rgba('+rgb+','+(.16+.5*(q.logL+5)/12)+')');halo.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=halo;g.beginPath();g.arc(x,y,r*2,0,Math.PI*2);g.fill();g.save();g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.clip();const grad=g.createRadialGradient(x-r*.2,y-r*.25,0,x,y,r);grad.addColorStop(0,'rgb('+rgb+')');grad.addColorStop(.7,'rgb('+rgb.map(v=>Math.round(v*.84))+')');grad.addColorStop(1,'rgb('+rgb.map(v=>Math.round(v*.4))+')');g.fillStyle=grad;g.fillRect(x-r,y-r,2*r,2*r);for(let i=0;i<420;i++){const u=((i*.61803398875+phase*.004)%1)*2-1,v=Math.sin(i*17.7)*.97;if(u*u+v*v>.97)continue;g.fillStyle=i%3?'rgba(25,10,8,.07)':'rgba(255,255,240,.1)';g.beginPath();g.ellipse(x+u*r,y+v*r,Math.max(.3,r*.023*Math.sqrt(1-u*u)),Math.max(.3,r*.01),0,0,Math.PI*2);g.fill()}g.restore();g.strokeStyle='#a8b2bd';g.lineWidth=.8;g.setLineDash([2,3]);g.beginPath();g.arc(sx,y,sun,0,Math.PI*2);g.stroke();g.setLineDash([]);g.font='10px system-ui';g.textAlign='center';g.fillStyle='#96a7bc';g.fillText('Sun',sx,Math.min(h-62,y+sun+18));g.fillStyle='#d5e4f6';g.fillText('Illustrative star',x,Math.min(h-62,y+r+18));g.textAlign='left';}
function drawHR(){const{g,w,h}=context('hr'),left=47,right=w-17,top=15,bottom=h-33,px=t=>left+(Math.log10(50000)-t)/(Math.log10(50000)-Math.log10(2500))*(right-left),py=l=>bottom-(l+4)/10*(bottom-top);g.font='10px system-ui';for(let l=-4;l<=6;l++){const y=py(l);g.strokeStyle='#233148';g.beginPath();g.moveTo(left,y);g.lineTo(right,y);g.stroke();g.fillStyle='#859ab5';g.fillText('10^'+l,3,y+3)}g.save();g.beginPath();g.rect(left,top,right-left,bottom-top);g.clip();for(const p of plot){g.fillStyle=phases[Math.round(p[2])]?.color+'50';g.fillRect(px(p[0]),py(p[1]),1.3,1.3)}g.strokeStyle='#f4fcff';g.fillStyle='rgb('+rgb+')';g.beginPath();g.arc(px(Math.log10(q.T)),py(q.logL),4,0,Math.PI*2);g.fill();g.stroke();g.restore();for(const t of [40000,10000,3000]){g.textAlign=t===40000?'left':t===3000?'right':'center';g.fillStyle='#a1b3cb';g.fillText(t.toLocaleString()+' kelvin',px(Math.log10(t)),h-9)}g.textAlign='left';g.fillStyle='#aec8d3';g.font='9px system-ui';g.fillText('Solar luminosities',left,10)}
window.addEventListener('resize',()=>{drawStar();drawHR()});
let last=0;function animate(now){if(now-last>33){if(!paused&&!document.hidden){phase+=Math.min((now-last)/1000,.1);drawStar()}last=now}requestAnimationFrame(animate)}
drawHR();drawStar();requestAnimationFrame(animate);load();
