from pathlib import Path
import json
p=Path(__file__).parent/'public'
f=p/'point-inference.js';s=f.read_text(encoding='utf-8')
s="import {spectralGravity} from './spectral.js';\n"+s
s=s.replace('inferPoint(meshes,q){','inferPoint(meshes,q,predict=null){')
s=s.replace('let count=0,maxResidual=0;', 'let count=0,maxResidual=0,tested=0,excluded=0,untested=0;')
old='let p=groups[phase];if(!p)p=groups[phase]={phase,count:0,'
new='''let spectralUntested=false;
if(q.useSpectrum){
 const predicted=([-1,0,2,3].includes(phase)&&predict)?predict(q.T,spectralGravity(q.T,q.logL,mass),mesh.metallicity):null;
 if(predicted===null){untested++;spectralUntested=true}else{tested++;if(Math.abs(predicted-q.wing)>q.wingError){excluded++;return}}
}
const groupKey=phase+':'+spectralUntested;let p=groups[groupKey];if(!p)p=groups[groupKey]={phase,spectralUntested,count:0,'''
assert old in s;s=s.replace(old,new)
s=s.replace('count,dims:2,mode:', 'count,spectral:{tested,excluded,untested},dims:q.useSpectrum?3:2,mode:')
f.write_text(s,encoding='utf-8')
f=p/'worker.js';s=f.read_text(encoding='utf-8');s="import{spectralCalibration}from './spectral.js';\n"+s
s=s.replace('let meshes=[],ready=false;', 'let meshes=[],ready=false,predict;')
s=s.replace('meshes.push(buildMesh(a));','const mesh=buildMesh(a);mesh.metallicity=f.initial_feh;meshes.push(mesh);')
s=s.replace('ready=true;postMessage', "const sr=await fetch('./data/spectral-index.json');if(!sr.ok)throw Error('Spectral calibration could not load');predict=spectralCalibration(await sr.json());ready=true;postMessage")
s=s.replace('inferPoint(meshes,e.data.q)', 'inferPoint(meshes,e.data.q,predict)');f.write_text(s,encoding='utf-8')
f=p/'app.js';s=f.read_text(encoding='utf-8');s=s.replace('tolZ:.2}', 'tolZ:.2,useSpectrum:false,wing:.08,wingError:.005}')
# Numeric measured index: keep exactly two large sliders, per the original layout request.
s=s.replace('enhanceSliders();', '''const spectralBox=document.createElement('details');spectralBox.className='spectral-control';spectralBox.innerHTML=`<summary>Magnesium absorption measurement</summary><label class="spectral-enable"><input type="checkbox" id="useSpectrum"> Use spectral measurement</label><div class="control-head"><label for="wing">Wing absorption <small>· nanometers</small></label><input type="number" id="wing" min="-0.4" max="0.4" step="0.001" value="0.08"></div><div class="control-head"><label for="wingError">Measurement uncertainty <small>· nanometers</small></label><input type="number" id="wingError" min="0.0001" max="0.4" step="0.001" value="0.005"></div><small>3,500–7,500 kelvin · fixed spectral resolution</small>`;$('controls').append(spectralBox);
$('useSpectrum').onchange=()=>{q.useSpectrum=$('useSpectrum').checked;changed()};
for(const id of ['wing','wingError'])$(id).oninput=()=>{const el=$(id),v=Number(el.value);if(el.value===''||!el.checkValidity()||!Number.isFinite(v)){el.setAttribute('aria-invalid','true');return}el.removeAttribute('aria-invalid');q[id]=v;changed()};
enhanceSliders();''')
s=s.replace('function syncFields(){', "function syncFields(){$('useSpectrum').checked=q.useSpectrum;for(const id of ['wing','wingError']){$(id).value=q[id];$(id).removeAttribute('aria-invalid')}")
s=s.replace("let n=r.groups.length;", "let n=new Set(r.groups.map(p=>p.phase)).size;$('spectralStatus').hidden=!q.useSpectrum;$('spectralStatus').textContent=q.useSpectrum?(r.spectral.untested?'Spectral matches + untested models':r.count?'Spectral matches':'No spectral match'):'';")
s=s.replace('${s.name}<small>', "${s.name}${p.spectralUntested?' · spectrum not tested':''}<small>")
s=s.replace("./worker.js?v=5", "./worker.js?v=7")
f.write_text(s,encoding='utf-8')
f=p/'index.html';s=f.read_text(encoding='utf-8');s=s.replace('<div id="stageCards">','<p id="spectralStatus" hidden></p><div id="stageCards">')
details='''<p><b>Optional spectral measurement:</b> enter the integrated absorption in the wings of the neutral-magnesium feature near 518.3604 nanometers. The index is the integral of one minus continuum-normalized flux, over 518.1104–518.3104 and 518.4104–518.6104 nanometers, in air wavelengths and the stellar rest frame. It includes blends, not just magnesium. Measure a continuum-normalized spectrum at resolving power 10,000, using the library's resolution convention; account for instrumental response, radial velocity and continuum errors before comparing. The uncertainty input is an absolute acceptance half-width in nanometers, not a probability or an uncertainty on the selected diagram point. The initial numbers are illustrative inputs, not measurements of the Sun.</p>
<p><b>Spectral calibration:</b> 2024 Bohlin/Mészáros synthetic stellar spectra, calculated with MARCS model atmospheres, 3,500–7,500 kelvin, sampled gravity and metallicity. Linear interpolation is used in temperature, logarithmic gravitational acceleration and metallicity, only with all required corners present. The selected temperature and luminosity still fix the radius; each evolutionary candidate's mass predicts gravity and therefore a synthetic absorption index. Candidates outside the measured index interval are excluded only where calibration exists.</p>
<p><b>Conditional atmosphere assumptions:</b> solar-relative element abundances, microturbulence of 2 kilometers per second, no additional rotational or macroturbulent broadening, no winds or emission. Atmospheric metallicity is assumed equal to the evolutionary track's initial iron abundance; surface diffusion and altered abundance ratios are not fitted. These assumptions can fail, particularly in evolved stars. The spectral test is applied only to pre-main-sequence, main-sequence, red-giant-branch and core-helium-burning candidates inside atmosphere-grid coverage. Later phases and missing coverage remain explicitly marked spectrum not tested and remain in the overall mass range. This is a conditional model comparison, not a universal mass determination or a calibrated statistical confidence interval. Magnesium abundance, turbulence, rotation and model-systematic uncertainty can preserve or increase ambiguity.</p>
<p><a href="https://arxiv.org/abs/2407.10872" target="_blank" rel="noopener">Published spectral library and assumptions</a> · <a href="https://stdatu.stsci.edu/hlsp/bosz" target="_blank" rel="noopener">Space Telescope Science Institute spectral archive</a> · <a href="data/spectral-index.json">Spectral calibration and source checksums</a></p>'''
s=s.replace('<div id="dataSummary"></div>', '<div id="dataSummary"></div>'+details)
s=s.replace('only the selected effective', 'with the optional spectral measurement disabled, only the selected effective')
s=s.replace('?v=6','?v=7');f.write_text(s,encoding='utf-8')
f=p/'style.css';f.write_text(f.read_text(encoding='utf-8')+'\n.spectral-control{padding:12px 0;border-top:1px solid #29374b}.spectral-control summary{cursor:pointer;padding:8px 0}.spectral-enable{display:flex;align-items:center;gap:10px;min-height:48px}.spectral-enable input{width:24px;height:24px}.spectral-control .control-head{margin:12px 0}.spectral-control input[type=number]{max-width:100px;min-height:44px}#spectralStatus{font-size:12px;color:#c2cedd}\n',encoding='utf-8')
status=Path(__file__).parent/'completion-status.json';d=json.loads(status.read_text(encoding='utf-8-sig'));d['spectral_measurement']={'status':'running','calibration':'Published 2024 magnesium wing flux index','validation':'pending','publication':'pending'};status.write_text(json.dumps(d,indent=2))
