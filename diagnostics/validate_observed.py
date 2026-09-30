import json, sqlite3, hashlib
from pathlib import Path
import pandas as pd
from build_observed import read, ROOT, CAT

d=json.loads((ROOT/'public/data/observed-stars.json').read_text()); m=d['manifest']; stars=d['stars']
assert len(stars)==len({s['id'] for s in stars})==15000
b=read('berger2018','table1.dat').set_index('KIC')
li=read('frasca2022','table4.dat');li['id']=pd.to_numeric(li.KIC.astype(str).str.extract(r'KIC(\d+)',expand=False),errors='coerce');li=li.set_index('id')
v=read('vrard2025','table2.dat').set_index('KIC');s=read('vrard2016','table2.dat').set_index('KIC')
training=pd.read_csv(ROOT/'diagnostics/mixed-mode-consensus-cohort.csv')
assert not set(training[training.partition=='train'].KIC)&{r['id'] for r in stars}
for r in stars:
    k=r['id']; original=b.loc[k]
    assert r['T']==original.Teff and r['classCode']==original.Evol
    assert abs(r['luminosity']-original['R*']**2*(original.Teff/5772)**4)<1e-10
    assert r['wing'] is None
    if r['lithium'] is not None: assert r['lithium']==li.loc[k]['EW(Li)']
    if r['DPi1'] is not None: assert r['DPi1']==s.loc[k].DPi1 and r['oscillationAlias']==s.loc[k].Alias
    if r['numax'] is not None: assert r['numax']==v.loc[k].numax
    if r['stageReference']: assert v.loc[k].Result==1 and r['stageReference']['phases']==([3] if v.loc[k].EV==2 else [2,4,5])
for c in m['categories']:
    assert sum(r['catalogClass']==c['label'] for r in stars)==c['sampleCount']
    assert abs(c['sampleCount']-15000*c['sourcePercent']/100)<1
for source in m['sources']:
    assert hashlib.sha256((CAT/source['catalog']/source['file']).read_bytes()).hexdigest()==source['sha256']
db=sqlite3.connect(ROOT/'public/data/observed-stars.sqlite')
assert db.execute('pragma integrity_check').fetchone()[0]=='ok'
assert db.execute('select count(*) from stars').fetchone()[0]==15000
assert db.execute('select count(*) from stars where magnesium is not null').fetchone()[0]==0
assert {r['id']:r for r in stars}=={k:json.loads(j) for k,j in db.execute('select kic,measurements_json from stars')}
report={'passed':True,'rowsChecked':15000,'sourceValuesVerified':True,'trainingOverlap':0,'coverage':m['coverage'],'databaseIntegrity':'ok'}
(ROOT/'validation').mkdir(exist_ok=True)
(ROOT/'validation/observed-source-audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
