from pathlib import Path
import re
root=Path(__file__).parent/'public'
p=root/'index.html';s=p.read_text(encoding='utf-8')
head=s[:s.index('<main>')]
details=re.search(r'<details>.*?</details>',s,re.S).group().replace('Scientific scope, data, and limitations','Details')
body='''<main>
<header><a class="brand" href="./">STAR LAB<span>✳</span></a><button id="reset" class="quiet">Reset</button></header>
<section class="panel diagram"><h1>H–R diagram</h1><canvas id="hr" aria-label="H–R diagram: luminosity versus temperature, with your measurement window"></canvas><div class="legend" id="legend"></div></section>
<section class="panel measurements" aria-label="Measurements"><div id="controls"></div><div class="presets"><button data-example="0">Solar-like</button><button data-example="2">Cool + bright</button><button data-example="5">Hot + faint</button></div></section>
<section class="hero"><div class="classification"><div class="section-heading"><h2>Star type <small>· compatible phases</small></h2><span class="live-dot" id="liveState">LOADING</span></div><div id="loading"><span>Loading models</span><progress id="loadProgress" value="0" max="1"></progress><span id="loadText"></span></div><div id="results" hidden><h3 id="verdict"></h3><div id="stageCards"></div></div></div>
<div class="scene"><canvas id="star" aria-label="Live illustration of your star and the Sun"></canvas><div class="scene-top"><span id="tempBadge"></span></div><div class="scene-bottom"><label for="sizeMode" class="sr-only">Radius scale</label><select id="sizeMode"><option value="compressed">Compressed radii</option><option value="linear">True ratio · auto zoom</option></select><button id="pause" aria-pressed="false">Pause</button></div></div>
<div class="readings"><div><span>RADIUS</span><strong id="radius">—</strong></div><div><span>MASS</span><strong id="mass">—</strong></div><div><span>COLOR</span><strong id="color">—</strong></div><div><span>PEAK</span><strong id="peak">—</strong></div></div></section>
<section class="science">'''+details+'''</section>
<div hidden aria-hidden="true"><span id="quickVerdict"></span><span id="inputMode"></span><span id="viewLabel"></span><span id="radiusRange"></span><span id="massRange"></span><span id="peakBand"></span><span id="verdictKind"></span><span id="verdictText"></span><span id="nextMeasurement"></span><span id="fitNote"></span></div>
</main><script type="module" src="app.js?v=2"></script></body></html>'''
head=head.replace('href="style.css"','href="style.css?v=2"')
p.write_text(head+body,encoding='utf-8')
p=root/'app.js';s=p.read_text(encoding='utf-8')
s=s.replace('Matching tolerance ±','±')
s=s.replace('<div class="endpoints"><span>${f.left}</span><span>${f.right}</span></div>','')
s=s.replace('<p class="help">${f.help}</p>','')
s=s.replace("label:'Effective temperature'","label:'Temperature'").replace("label:'Bolometric luminosity'","label:'Luminosity'").replace("label:'Surface metals / hydrogen'","label:'Surface metals / H'")
a=s.index("$('stageCards').innerHTML=");b=s.index('\nlet next;',a)
s=s[:a]+"$('stageCards').innerHTML=r.groups.map(p=>{const s=phases[p.phase];return `<span class=\"stage-chip\" style=\"--phase:${s.color}\">${s.name}</span>`}).join('');\n$('verdict').textContent=n===0?'No grid match':n===1?'':'Ambiguous · '+n+' phases';"+s[b:]
s=s.replace("fmt(d.total/1e6)+' MB · '+d.files+' grid files loaded'","fmt(d.total/1e6)+' MB'")
p.write_text(s,encoding='utf-8')
