from pathlib import Path
import re
root=Path(__file__).parent/'public';p=root/'app.js';s=p.read_text(encoding='utf-8')
s=s.replace('tolT:3,tolL:.12','tolT:0,tolL:0')
s=re.sub(r'<div class="tolerance">.*?</div>','',s)
start=s.index('$(f.tol).oninput=');end=s.index('if(f.toggle)',start);s=s[:start]+s[end:]
s=s.replace('$(f.tol).value=q[f.tol];','').replace("$(f.tol).removeAttribute('aria-invalid');",'')
s=s.replace("[f.key,f.key+'Slider',f.tol]","[f.key,f.key+'Slider']")
s=s.replace("new URL('./worker.js',import.meta.url)","new URL('./worker.js?v=5',import.meta.url)")
s=s.replace('${s.name}</span>`','${s.name}<small>${fmt(p.mass[0])}–${fmt(p.mass[1])} M☉</small></span>`')
s=s.replace("'No grid match'","'No model coverage at this point'")
start=s.index('const x1=px(Math.log10(q.T*(1+q.tolT/100)))');end=s.index("g.fillStyle='rgb('+rgb+')';",start)
s=s[:start]+"g.strokeStyle='#f4fcff';"+s[end:]
p.write_text(s,encoding='utf-8')
p=root/'index.html';s=p.read_text(encoding='utf-8').replace('style.css?v=4','style.css?v=5').replace('app.js?v=4','app.js?v=5').replace('with your measurement window','with your selected point')
s=s.replace('only effective temperature and bolometric luminosity constrain the model matching.','only the selected effective temperature and bolometric luminosity constrain the model interpolation.')
s=s.replace('The displayed mass range spans all compatible sampled models;','The displayed mass range spans interpolated model solutions at the selected point;')
s=re.sub(r'<p><b>Matching method:</b>.*?</p>','<p><b>Point interpolation:</b> no tolerance box or nearest-neighbor fallback is used. The selected log temperature and log luminosity are evaluated on piecewise-linear triangles formed from adjacent log-age (0.05 dex) and adjacent EEP nodes, separately at each initial metallicity. Barycentric weights reproduce the selected position; current mass and log age are interpolated with those weights. Only same-phase triangles are used. Cells with missing corners, degenerate geometry, or spans exceeding 0.05 dex in log temperature or 0.25 dex in log luminosity are excluded to avoid bridging coarse gaps. No interpolation is performed between metallicities. A missing match means no coverage by this finite interpolant, not proof that the star cannot exist. All overlapping solutions are retained, with a mass range shown for each phase. These are model-dependent interpolation results, not precise measurements, probability distributions, or uniquely known masses.</p>',s,flags=re.S)
s=s.replace('The displayed intervals are conservative extrema over the entered tolerance box, not 68% or 95% confidence intervals.','Displayed mass ranges are extrema of overlapping interpolated model solutions, not 68% or 95% confidence intervals.')
s=s.replace('Gravity input is','The model gravity convention is')
s=s.replace('All enabled measurement windows','Selected measurements')
p.write_text(s,encoding='utf-8')
p=root/'style.css';s=p.read_text(encoding='utf-8');s+='\n.stage-chip small{display:block;margin-top:4px;color:#b7c6d8;font-size:11px}\n';p.write_text(s,encoding='utf-8')
