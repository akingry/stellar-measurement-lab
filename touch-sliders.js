// Keep gestures that begin on a slider local to the control. Page scrolling
// remains native everywhere else; operating-system edge gestures are not ours.
export function enhanceSliders(){
for(const slider of document.querySelectorAll('input[type=range]')){
const row=document.createElement('div');row.className='slider-touch-row';slider.before(row);row.append(slider);
const name=slider.getAttribute('aria-label').replace(/ slider$/,'');
for(const [direction,label] of [[-1,'Decrease'],[1,'Increase']]){
const button=document.createElement('button');button.type='button';button.className='slider-nudge';button.textContent=direction<0?'−':'+';button.setAttribute('aria-label',label+' '+name);button.disabled=slider.disabled;
button.onclick=()=>{if(slider.disabled)return;const step=Number(slider.step)||.001,delta=Math.max(step,(Number(slider.max)-Number(slider.min))*.005);setValue(Number(slider.value)+direction*delta)};
if(direction<0)row.prepend(button);else row.append(button);
new MutationObserver(()=>button.disabled=slider.disabled).observe(slider,{attributes:true,attributeFilter:['disabled']});
}
function setValue(value){const lo=Number(slider.min),hi=Number(slider.max),step=Number(slider.step)||.001;slider.value=String(Math.min(hi,Math.max(lo,lo+Math.round((value-lo)/step)*step)));slider.dispatchEvent(new Event('input',{bubbles:true}))}
let pointer=null;
function position(e){const rect=slider.getBoundingClientRect(),thumb=30,ratio=Math.min(1,Math.max(0,(e.clientX-rect.left-thumb/2)/(rect.width-thumb)));setValue(Number(slider.min)+ratio*(Number(slider.max)-Number(slider.min)))}
slider.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||slider.disabled||!e.isPrimary)return;pointer=e.pointerId;e.preventDefault();slider.setPointerCapture(pointer);position(e)},{passive:false});
slider.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();position(e)},{passive:false});
slider.addEventListener('pointerup',e=>{if(e.pointerId!==pointer)return;e.preventDefault();position(e);if(slider.hasPointerCapture(pointer))slider.releasePointerCapture(pointer);pointer=null;slider.dispatchEvent(new Event('change',{bubbles:true}))},{passive:false});
slider.addEventListener('pointercancel',()=>pointer=null);slider.addEventListener('lostpointercapture',()=>pointer=null);
// Non-passive Touch Events also prevent a WebKit webview from treating an
// active control drag as a scrolling gesture. Never installed on the document.
for(const type of ['touchstart','touchmove'])slider.addEventListener(type,e=>{if(!slider.disabled&&e.touches.length===1&&e.cancelable)e.preventDefault()},{passive:false});
}
}
