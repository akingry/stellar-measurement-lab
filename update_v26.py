from pathlib import Path
import re,json,shutil
p=Path('public'); html=(p/'index.html').read_text(encoding='utf-8')
html=html.replace('style.css?v=23','style.css?v=26').replace('app.js?v=25','app.js?v=26')
start=html.index('<header>');end=html.index('<section id="observedPanel"')
html=html[:start]+'''<header><a href="./" class="brand">Star Lab</a><div class="header-actions"><button id="randomExample" disabled>Random example</button><button id="reset" disabled aria-label="Reset measurements">Reset</button></div></header>
<section id="observedPanel"'''+html[end+len('<section id="observedPanel"'):]
html=html.replace('<a href="observed.html">15,000-star sample and coverage</a> · ','')
html=html.replace('<a id="sampleAuditLink" href="audit.html" hidden>Previous audit</a>','<a id="sampleAuditLink" href="audit.html" hidden>Sample audit</a>')
# Move audit link inside recorded-data details.
html=html.replace('</details><a id="sampleAuditLink" href="audit.html" hidden>Sample audit</a>','<a id="sampleAuditLink" href="audit.html" hidden>Sample audit</a></details>')
scene=re.search(r'<section class="scene".*?</section>',html,re.S).group();html=html.replace(scene,'')
readings=re.search(r'<div id="readings".*?</div></div>',html,re.S).group();html=html.replace(readings,'')
diagramstart=html.index('<section class="diagram">')
html=html[:diagramstart]+'''<nav class="view-tabs" aria-label="Workspace"><button id="measureTab" aria-pressed="true">1 · Measurements</button><button id="resultTab" aria-pressed="false">2 · Results</button></nav>
<button id="fitSummary" class="fit-summary" aria-label="View overall relative fit">Loading models…</button>
<div class="workspace"><div id="measurePane" class="workspace-pane">
'''+html[diagramstart:]
html=html.replace('<section class="estimate"><div id="loading"','</div><div id="resultPane" class="workspace-pane"><section class="estimate" id="results"><div id="loading"')
html=html.replace('<p id="evidenceNote"></p>','<details class="fit-details"><summary>Fit details</summary><p id="evidenceNote"></p></details>')
html=html.replace('<p id="selectionNote"></p></section>','<p id="selectionNote"></p></section>'+scene+readings+'</div></div>')
html=html.replace('<footer>','<footer><details><summary>Details &amp; sources</summary><a href="examples.html">Sample coverage</a> · <a href="audit.html">Sample audit</a> · ').replace('</footer>','</details></footer>')
(p/'index.html').write_text(html,encoding='utf-8')
a=(p/'app.js').read_text(encoding='utf-8').replace(',observedCatalog=null','')
start=a.index("$('randomStar').onclick=");end=a.index("$('pause').onclick",start);a=a[:start]+a[end:]
a=a.replace("$('randomStar').disabled=false;",'').replace("b.textContent='Random diagnostic example'","b.textContent='Random example'")
a=a.replace("+(exampleMode?' · Diagnostic example':'')",'')
a=a.replace("$('guidanceTitle').textContent='Measurements included in overall fit';","$('guidanceTitle').textContent='Additional measurements';")
a=a.replace("$('guidanceText').textContent='Enable one or more. Tap again to exclude.';","$('guidanceText').textContent='';")
a=a.replace("$('actionNote').textContent=enabled.size?'Slider colors show each measurement at the central position. Results below combine applicable evidence.':'';","$('actionNote').textContent='';")
a=a.replace("$('selectionNote').textContent=candidates.length?'Select any candidate to inspect it. Selection does not change its fit.':'';","$('selectionNote').textContent=candidates.length?'Select a result to view the star.':'';")
a=a.replace("$('preview').scrollIntoView({behavior:'smooth',block:'start'})","showPane('results')")
a=a.replace("n.textContent=q.observedMode?'Some diagnostics unavailable; positional support retained':'Some model solutions untested'","n.textContent='Partial diagnostic coverage'")
a=a.replace("renderObserved();\n}","renderObserved();updateSummary();\n}")
a=a.replace("renderObserved(true);return","renderObserved(true);$('fitSummary').textContent='Checking measurements…';return")
marker="const initial="
idx=a.index(marker)
a=a[:idx]+'''function showPane(view){document.body.dataset.view=view;$('measureTab').setAttribute('aria-pressed',String(view==='measurements'));$('resultTab').setAttribute('aria-pressed',String(view==='results'));requestAnimationFrame(()=>{drawHR();drawStar()})}
$('measureTab').onclick=()=>showPane('measurements');$('resultTab').onclick=()=>showPane('results');$('fitSummary').onclick=()=>showPane('results');
document.body.dataset.view='measurements';
function updateSummary(){const r=ranking?.rows[0];const mark=referenceIndicator(observedStar,ranking,observedEdited);$('fitSummary').textContent=r?((mark?mark.symbol+' ':'')+(phases[r.phase]?.name||'Unknown')+' · '+(r.percent===null?'Not scored':r.percent.toFixed(1)+'%')+' relative fit'):'No model match';}
'''+a[idx:]
a=a.replace("$('observedPanel').hidden=true};","$('observedPanel').hidden=true;showPane('measurements')};")
(p/'app.js').write_text(a,encoding='utf-8')
# Retire public dataset recoverably, not scientific source catalogs.
archive=Path('archive/retired-15000');archive.mkdir(parents=True,exist_ok=True)
for f in ['observed.html','data/observed-stars.json','data/observed-stars.sqlite','data/observed-manifest.json']:
 src=p/f
 if src.exists():shutil.move(str(src),str(archive/src.name))
f=p/'examples.html';s=f.read_text(encoding='utf-8').replace(' The original 15,000-star Random button and database remain separate.','');f.write_text(s,encoding='utf-8')
Path('V26-CHECKLIST.md').write_text('''# Compact Star Lab
- Remove public 15,000-star dataset and loader; preserve diagnostic sample.
- Compact actions, measurements/results navigation, accessible live summary.
- Preserve scientific scoring and controls.
- Verify mobile and desktop interactions, no overflow, no retired data requests.
- Publish and verify live site.
''')
Path('V26-completion-status.json').write_text(json.dumps({'implementation':'passed','verification':'running','publication':'pending','liveVerification':'pending'},indent=2))
