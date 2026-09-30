from pathlib import Path
p=Path('public');s=(p/'style.css').read_text(encoding='utf8');a,b=s.split('/* Compact measurements',1);(p/'style.css').write_text(a,encoding='utf8');(p/'workspace.css').write_text('/* Compact measurements'+b,encoding='utf8');f=p/'index.html';s=f.read_text(encoding='utf8').replace('</head>','<link rel="stylesheet" href="workspace.css?v=26"></head>');f.write_text(s,encoding='utf8')
f=p/'app.js';s=f.read_text(encoding='utf8').replace("r.percent.toFixed(1)+'%')+' relative fit'","r.percent>99.9&&ranking.rows.length>1?'>99.9%':r.percent<.1?'<0.1%':r.percent.toFixed(1)+'%')+' relative fit'");f.write_text(s,encoding='utf8')
for name in ['lithium-scale.js','magnesium-scale.js']:
 f=p/name;s=f.read_text(encoding='utf8').replace(' \u00b7 stronger color = stronger lead','').replace(' \u00b7 color = leader; brighter = stronger lead','').replace('Expanded nonlinear scale \u00b7 actual absorption shown above','Nonlinear scale');f.write_text(s,encoding='utf8')
f=p/'app.js';s=f.read_text(encoding='utf8').replace('./lithium-scale.js?v=22','./lithium-scale.js?v=26').replace('./magnesium-scale.js?v=22','./magnesium-scale.js?v=26');f.write_text(s,encoding='utf8')
