import{derived,phases}from './engine.js';
import{enhanceSliders}from './touch-sliders.js';
import{spectralCalibration}from './spectral.js';
import{calibratedModels,bounds}from './selection.js';
const $=id=>document.getElementById(id);
let q={T:5772,logL:0,tolT:0,tolL:0},visual=derived(q),rgb=[255,245,225],plot=[],models=[],ranges=[],result=null,ready=false,phase=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=(n,d=5)=>n.toLocaleString('en-US',{maximumSignificantDigits:d});
const fields=[['T','Temperature','kelvin'],['logL','Luminosity','solar luminosities'],['wing','Magnesium wing absorption','nanometers']];
fields.forEach(([id,label,unit],k)=>{
 const box=document.createElement('div');box.className='control';
 box.innerHTML='<div class="control-head"><label for="'+id+'Slider">'+label+'</label><output id="'+id+'"></output></div><input type="range" id="'+id+'Slider" aria-label="'+label+' slider" step="any" disabled>';
 $('controls').append(box);
 $(id+'Slider').oninput=e=>{const value=+e.target.value;q[id]=k===0?10**value:value;apply()};
});
enhanceSliders();
function apply(){result=null;visual=derived(q);rgb=blackbody(q.T);
 fields.forEach(([id,label,unit],k)=>{$(id+'Slider').value=k===0?Math.log10(q.T):q[id];$(id).textContent=fmt(id==='logL'?10**q.logL:q[id],6)+' '+unit});
 $('verdict').textContent='Stage unresolved';
 $('radius').textContent=fmt(visual.radius,3)+' solar radii';
 $('tempBadge').textContent=fmt(q.T,4)+' kelvin';
 drawHR();drawStar();
}
$('reset').onclick=()=>{q={...q,T:5772,logL:0,wing:.08};apply()};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused))};
$('pause').textContent=paused?'Resume':'Pause';
$('sizeMode').onchange=drawStar;
async function load(){try{
 const manifest=await (await fetch('data/manifest.json')).json(),file=manifest.files.find(f=>f.initial_feh===0);
 const response=await fetch('data/'+file.name);if(!response.ok)throw Error('Model download failed');
 const zipped=await response.arrayBuffer();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',zipped)),v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!==file.sha256)throw Error('Model checksum failed');
 const a=new Float32Array(await new Response(new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
 const calibration=await (await fetch('data/spectral-index.json')).json();
 models=calibratedModels(a,spectralCalibration(calibration));if(!models.length)throw Error('No calibrated models');
 ranges=bounds(models);plot=models.filter((m,i)=>i%8===0).map(m=>[Math.log10(m.T),m.logL,m.stage]);
 fields.forEach(([id],k)=>{const el=$(id+'Slider');el.min=ranges[k][0];el.max=ranges[k][1];el.step=(ranges[k][1]-ranges[k][0])/1000000;el.disabled=false});
 $('reset').disabled=false;$('loading').hidden=true;ready=true;$('reset').click();
 }catch(e){$('loading').textContent=e.message;}}
window.starLab={get ready(){return ready},get state(){return {...q}},get result(){return result},get physical(){return visual},get modelCount(){return models.length}};
function blackbody(T){let X=0,Y=0,Z=0;for(let nm=380;nm<=780;nm+=5){const gauss=(mu,a,b)=>Math.exp(-.5*((nm-mu)*(nm<mu?a:b))**2),x=.362*gauss(442,.0624,.0374)+1.056*gauss(599.8,.0264,.0323)-.065*gauss(501.1,.049,.0382),y=.821*gauss(568.8,.0213,.0247)+.286*gauss(530.9,.0613,.0322),z=1.217*gauss(437,.0845,.0278)+.681*gauss(459,.0385,.0725),p=1/(nm**5*Math.expm1(1.438776877e7/(nm*T)));X+=p*x;Y+=p*y;Z+=p*z}X/=Y;Z/=Y;Y=1;let c=[3.2406*X-1.5372*Y-.4986*Z,-.9689*X+1.8758*Y+.0415*Z,.0557*X-.204*Y+1.057*Z],max=Math.max(...c);return c.map(v=>{v=Math.max(0,v/max);return Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055))})}
function context(id){const c=$(id),w=c.clientWidth,h=c.clientHeight,d=Math.min(devicePixelRatio||1,2);if(c.width!==Math.round(w*d)||c.height!==Math.round(h*d)){c.width=Math.round(w*d);c.height=Math.round(h*d)}const g=c.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);return{g,w,h}}
function drawStar(){const{g,w,h}=context('star'),linear=$('sizeMode').value==='linear',ratio=linear?visual.radius:visual.radius**.18,max=Math.min(w*.2,h*.29),unit=max/Math.max(ratio,1),r=Math.max(.6,unit*ratio),sun=Math.max(.6,unit),x=w*.67,y=h*.49,sx=w*.26;for(let i=0;i<95;i++){g.fillStyle='rgba(190,214,247,'+(.08+(i%4)*.045)+')';g.fillRect((Math.sin(i*83.2)*.5+.5)*w,(Math.cos(i*54.3)*.5+.5)*h,1,1)}const halo=g.createRadialGradient(x,y,r*.75,x,y,r*2);halo.addColorStop(0,'rgba('+rgb+','+(.16+.5*(q.logL+5)/12)+')');halo.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=halo;g.beginPath();g.arc(x,y,r*2,0,Math.PI*2);g.fill();g.save();g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.clip();const grad=g.createRadialGradient(x-r*.2,y-r*.25,0,x,y,r);grad.addColorStop(0,'rgb('+rgb+')');grad.addColorStop(.7,'rgb('+rgb.map(v=>Math.round(v*.84))+')');grad.addColorStop(1,'rgb('+rgb.map(v=>Math.round(v*.4))+')');g.fillStyle=grad;g.fillRect(x-r,y-r,2*r,2*r);for(let i=0;i<420;i++){const u=((i*.61803398875+phase*.004)%1)*2-1,v=Math.sin(i*17.7)*.97;if(u*u+v*v>.97)continue;g.fillStyle=i%3?'rgba(25,10,8,.07)':'rgba(255,255,240,.1)';g.beginPath();g.ellipse(x+u*r,y+v*r,Math.max(.3,r*.023*Math.sqrt(1-u*u)),Math.max(.3,r*.01),0,0,Math.PI*2);g.fill()}g.restore();g.strokeStyle='#a8b2bd';g.lineWidth=.8;g.setLineDash([2,3]);g.beginPath();g.arc(sx,y,sun,0,Math.PI*2);g.stroke();g.setLineDash([]);g.font='10px system-ui';g.textAlign='center';g.fillStyle='#96a7bc';g.fillText('Sun',sx,Math.min(h-62,y+sun+18));g.fillStyle='#d5e4f6';g.fillText('Illustrative star',x,Math.min(h-62,y+r+18));g.textAlign='left';}
function drawHR(){const{g,w,h}=context('hr'),left=47,right=w-17,top=15,bottom=h-33,px=t=>left+(Math.log10(7800)-t)/(Math.log10(7800)-Math.log10(3300))*(right-left),py=l=>bottom-(l+2)/7.5*(bottom-top);g.font='10px system-ui';for(let l=-2;l<=5;l++){const y=py(l);g.strokeStyle='#233148';g.beginPath();g.moveTo(left,y);g.lineTo(right,y);g.stroke();g.fillStyle='#859ab5';g.fillText('10^'+l,3,y+3)}g.save();g.beginPath();g.rect(left,top,right-left,bottom-top);g.clip();for(const p of plot){g.fillStyle=phases[Math.round(p[2])]?.color+'50';g.fillRect(px(p[0]),py(p[1]),1.3,1.3)}g.strokeStyle='#f4fcff';g.fillStyle='rgb('+rgb+')';g.beginPath();g.arc(px(Math.log10(q.T)),py(q.logL),4,0,Math.PI*2);g.fill();g.stroke();g.restore();for(const t of [7500,5000,3500]){g.textAlign=t===7500?'left':t===3500?'right':'center';g.fillStyle='#a1b3cb';g.fillText(t.toLocaleString()+' kelvin',px(Math.log10(t)),h-9)}g.textAlign='left';g.fillStyle='#aec8d3';g.font='9px system-ui';g.fillText('Solar luminosities',left,10)}
window.addEventListener('resize',()=>{drawStar();drawHR()});
let last=0;function animate(now){if(now-last>33){if(!paused&&!document.hidden){phase+=Math.min((now-last)/1000,.1);drawStar()}last=now}requestAnimationFrame(animate)}
drawHR();drawStar();requestAnimationFrame(animate);load();
