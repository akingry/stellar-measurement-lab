"""Verify sample provenance against original measured catalog rows, not predictions."""
from pathlib import Path
import hashlib,json,math,sqlite3
import pandas as pd
from astropy.io import ascii
from build_observed import read,ROOT
d=json.loads((ROOT/'public/data/diagnostic-stars.json').read_text())
b=read('berger2018','table1.dat').set_index('KIC')
li=read('frasca2022','table4.dat');li['id']=pd.to_numeric(li.KIC.astype(str).str.extract(r'KIC(\d+)',expand=False),errors='coerce');li=li.set_index('id')
v=read('vrard2025','table2.dat').set_index('KIC');seis=read('vrard2016','table2.dat').set_index('KIC')
training=pd.read_csv(ROOT/'diagnostics/mixed-mode-consensus-cohort.csv')
assert not set(training[training.partition=='train'].KIC)&{r['id'] for r in d['stars'] if isinstance(r['id'],int)}
for r in d['stars']:
    k=r['id']
    if isinstance(k,int):
        row=b.loc[k]
        assert r['T']==row.Teff and r['classCode']==row.Evol
        assert math.isclose(r['luminosity'],row['R*']**2*(row.Teff/5772)**4,rel_tol=1e-12)
        if r['lithium'] is not None:
            assert r['lithium']==li.loc[k]['EW(Li)'] and r['lithiumError']==li.loc[k]['e_EW(Li)']
        if r['DPi1'] is not None:assert r['DPi1']==seis.loc[k].DPi1
        if r['numax'] is not None:assert r['numax']==v.loc[k].numax
    elif k.startswith('PENELLOPE:'):
        p=r['provenance']['lithium'];folder=ROOT/'diagnostics/catalogs/young2026'
        table=ascii.read(folder/p['table'],format='cds',readme=str(folder/'ReadMe')).to_pandas()
        row=table[(table.Name==p['name'])&(table['Obs.Date']==p['date'])].iloc[0]
        assert r['lithium']==row['EWLiveil+Fe'] and r['T']==row.Teff
        assert math.isclose(r['lithiumError'],math.hypot((1+row.r650)*row.e_EWLiraw,row.EWLiraw*row.e_r650))
    else:assert r.get('provenance',{}).get('url','').startswith('https://arxiv.org/')
    assert r['wing'] is None
    for key in ['T','luminosity']:assert math.isfinite(r[key]) and r[key]>0
    assert 'initialMass' not in r and 'mass' not in r
db=sqlite3.connect(ROOT/'public/data/diagnostic-benchmark.sqlite')
assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
assert db.execute('SELECT count(*) FROM selected_examples').fetchone()[0]==len(d['stars'])
assert db.execute('SELECT count(*) FROM observations').fetchone()[0]==d['manifest']['sourceAuditCount']
for _,value in db.execute('SELECT star_id,measurements_json FROM observations'):
    row=json.loads(value);assert not any(k in row for k in ['classCode','catalogClass','stageReference','spectralType'])
originalHash=hashlib.sha256((ROOT/'public/data/observed-stars.json').read_bytes()).hexdigest()
assert originalHash=='6303aeef763b9a7820bdbae220ea873efab5860660d9312f44d7d2be35323532'
result={'passed':True,'sampleCount':len(d['stars']),'fullAuditCount':d['manifest']['sourceAuditCount'],'trainingObjectOverlap':0,'originalHash':originalHash,'databaseIntegrity':'ok','referenceLabelsStoredSeparately':True}
(ROOT/'validation/v22-source-audit.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
