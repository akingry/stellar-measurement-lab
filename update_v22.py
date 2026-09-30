from pathlib import Path
root=Path(__file__).resolve().parent
for name in ['app.js','index.html']:
    p=root/'public'/name
    s=p.read_text(encoding='utf-8').replace('?v=21','?v=22')
    if name=='app.js':s=s.replace("from './engine.js'","from './engine.js?v=22'")
    p.write_text(s,encoding='utf-8')
