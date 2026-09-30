from pathlib import Path
import re
root=Path(__file__).parent/'public'
p=root/'app.js';s=p.read_text(encoding='utf-8')
s=s.replace('useG:true,useZ:false','useG:false,useZ:false').replace('useG:true,useZ:true','useG:false,useZ:false')
start=s.index(",{key:'g',label:")
end=s.index('];\nfor(const f of fields)',start)
s=s[:start]+s[end:]
s=s.replace("visual.mass===null?'Needs gravity'","visual.mass===null?'—'")
needle="$('stageCards').innerHTML="
pos=s.index(needle)
s=s[:pos]+"if(r.groups.length){const lo=Math.min(...r.groups.map(p=>p.mass[0])),hi=Math.max(...r.groups.map(p=>p.mass[1]));$('mass').textContent=fmt(lo)+'–'+fmt(hi)+' M☉'}else{$('mass').textContent='—'}\n"+s[pos:]
p.write_text(s,encoding='utf-8')
p=root/'index.html';s=p.read_text(encoding='utf-8').replace('style.css?v=3','style.css?v=4').replace('app.js?v=3','app.js?v=4').replace('<span>MASS</span>','<span>MODEL MASS RANGE</span>')
s=s.replace('<div id="dataSummary"></div>','<div id="dataSummary"></div><p><b>Two-input mode:</b> only effective temperature and bolometric luminosity constrain the model matching. Gravity and composition are not supplied or assumed measured. The displayed mass range spans all compatible sampled models; it is model-dependent, not a direct mass measurement or confidence interval.</p>')
s=s.replace('the optional input is bulk surface [M/H]','the model cache includes bulk surface [M/H]')
p.write_text(s,encoding='utf-8')
