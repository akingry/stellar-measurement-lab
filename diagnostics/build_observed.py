"""Reproducible, proportionate real-star sample; never synthesize missing data."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import gzip, hashlib, json, math, sqlite3, sys
import numpy as np
import pandas as pd
import requests
from astropy.io import ascii

ROOT = Path(__file__).resolve().parent.parent
CAT = ROOT / 'diagnostics/catalogs'
OUT = ROOT / 'public/data'
SOURCES = {'berger2018':'J/ApJ/866/99','frasca2022':'J/A+A/664/A78',
           'vrard2016':'J/A+A/588/A87','vrard2025':'J/A+A/697/A165'}
FILES = {'berger2018':['ReadMe','table1.dat'], 'frasca2022':['ReadMe','table2.dat','table4.dat'],
         'vrard2016':['ReadMe','table2.dat'], 'vrard2025':['ReadMe','table2.dat']}

def fetch(item):
    name, file = item; folder = CAT/name; folder.mkdir(parents=True,exist_ok=True)
    path=folder/file; url=f'https://cdsarc.cds.unistra.fr/ftp/{SOURCES[name]}/{file}'
    if not path.exists():
        r=requests.get(url,timeout=90)
        if r.status_code==404: r=requests.get(url+'.gz',timeout=90)
        r.raise_for_status(); content=r.content
        if content[:2]==b'\x1f\x8b': content=gzip.decompress(content)
        path.write_bytes(content)
    return dict(catalog=name,file=file,url=url,sha256=hashlib.sha256(path.read_bytes()).hexdigest())

def read(name,file):
    return ascii.read(CAT/name/file,format='cds',readme=str(CAT/name/'ReadMe')).to_pandas()

def val(x):
    return None if pd.isna(x) else float(x)

def main():
    with ThreadPoolExecutor(max_workers=4) as pool:
        provenance=list(pool.map(fetch,[(n,f) for n,fs in FILES.items() for f in fs]))
    b=read('berger2018','table1.dat')
    training=pd.read_csv(ROOT/'diagnostics/mixed-mode-consensus-cohort.csv')
    training_ids=set(training.loc[training.partition=='train','KIC'].astype(int))
    base=b[~b.KIC.isin(training_ids)].copy()
    assert len(base)==base.KIC.nunique()
    counts=base.Evol.value_counts().sort_index()
    # Preserve the published source proportions while drawing only non-training IDs.
    allocation=b.Evol.value_counts().sort_index()/len(b)*15000
    sizes=np.floor(allocation).astype(int)
    for k in (allocation-sizes).sort_values(ascending=False).index[:15000-int(sizes.sum())]: sizes[k]+=1
    sample=pd.concat([base[base.Evol==k].sample(n=int(sizes[k]),random_state=20260930+int(k)) for k in sizes.index])
    sample=sample.sample(frac=1,random_state=20260930).reset_index(drop=True)
    expanded = '--diagnostic-pool' in sys.argv
    if expanded:
        sample=base
    li=read('frasca2022','table4.dat'); sp=read('frasca2022','table2.dat')
    for t in [li,sp]:
        t['id']=pd.to_numeric(t.KIC.astype(str).str.extract(r'KIC(\d+)',expand=False),errors='coerce')
    assert not li[li.id.notna()].id.duplicated().any()
    li=li.set_index('id'); sp=sp.set_index('id')
    seis=read('vrard2016','table2.dat').set_index('KIC')
    stage=read('vrard2025','table2.dat').set_index('KIC')
    records=[]
    labels={0:'Main sequence',1:'Subgiant',2:'Red giant (broad catalog class)'}
    for _,r in sample.iterrows():
        k=int(r.KIC); a=li.loc[k] if k in li.index else None
        c=sp.loc[k] if k in sp.index else None
        s=seis.loc[k] if k in seis.index else None
        v=stage.loc[k] if k in stage.index else None
        ev=int(r.Evol); L=float(r['R*'])**2*(float(r.Teff)/5772)**4
        lithium=val(a['EW(Li)']) if a is not None else None
        limit=str(a['l_EW(Li)']).strip() if a is not None and pd.notna(a['l_EW(Li)']) else ''
        ref=None
        if v is not None and int(v.Result)==1 and int(v.EV) in [1,2]:
            ref={'label':'Hydrogen-shell / asymptotic-giant group' if int(v.EV)==1 else 'Core helium burning',
                 'phases':[2,4,5] if int(v.EV)==1 else [3], 'source':'vrard2025',
                 'independence':'Seismic consensus; shares diagnostic evidence with the app, not independent ground truth.'}
        record={'id':k,'T':int(r.Teff),'temperatureError':int(r.e_Teff),'luminosity':L,
                'radius':float(r['R*']),'radiusErrorLower':float(r['e_R*']),'radiusErrorUpper':float(r['E_R*']),
                'lithium':lithium,'lithiumError':val(a['e_EW(Li)']) if a is not None else None,
                'lithiumLimit':limit or None,'wing':None,
                'Dnu':val(s.Dnu) if s is not None else (val(v.dnu) if v is not None else None),
                'numax':val(v.numax) if v is not None else None,
                'DPi1':val(s.DPi1) if s is not None else None,
                'periodSpacingError':val(s.e_DPi1) if s is not None else None,
                'oscillationAlias':int(s.Alias) if s is not None else None,
                'spectralType':str(c.SpType) if c is not None and pd.notna(c.SpType) else None,
                'catalogClass':labels[ev],'classCode':ev,'stageReference':ref,
                'binaryFlag':int(r.Bin) if pd.notna(r.Bin) else None}
        records.append(record)
    if expanded:
        records=[r for r in records if (r['lithium'] is not None and not r['lithiumLimit']) or (all(r[k] is not None and r[k]>0 for k in ['Dnu','numax','DPi1']) and r['oscillationAlias']==0)]
        assert not {r['id'] for r in records}&training_ids
        folder=ROOT/'diagnostics/representative'
        folder.mkdir(exist_ok=True)
        manifest={'count':len(records),'population':'All diagnostic-bearing cross-matches in the source Kepler population; no parent-sample limit',
                  'sources':provenance,'excludedTrainingStars':len(b)-len(base),
                  'selection':'Observed usable lithium OR unaliased three-part oscillations, excluding seismic training IDs. No label-agreement filtering.',
                  'categories':{label:sum(r['catalogClass']==label for r in records) for label in labels.values()}}
        (folder/'expanded-pool.json').write_text(json.dumps({'manifest':manifest,'stars':records},separators=(',',':'),allow_nan=False),encoding='utf-8')
        print(json.dumps(manifest,indent=2));return
    coverage={key:sum(r[key] is not None for r in records) for key in ['T','luminosity','lithium','wing','Dnu','numax','DPi1','spectralType','stageReference']}
    coverage['completeAllMeasurements']=sum(all(r[key] is not None for key in ['T','luminosity','lithium','wing','Dnu','numax','DPi1']) for r in records)
    coverage['usableLithium']=sum(r['lithium'] is not None and not r['lithiumLimit'] for r in records)
    coverage['seismicTriplet']=sum(all(r[key] is not None for key in ['Dnu','numax','DPi1']) and r['oscillationAlias']==0 for r in records)
    manifest={'version':1,'seed':20260930,'count':len(records),'population':'Berger 2018 Kepler target proportions; samples exclude app seismic-training stars',
      'sourcePopulationCount':len(b),'eligiblePopulationCount':len(base),'excludedTrainingStars':len(b)-len(base),
      'categories':[{'label':labels[int(k)],'sourceCount':int((b.Evol==k).sum()),'sourcePercent':float((b.Evol==k).mean()*100),
                     'eligibleCount':int(counts[k]),'eligiblePercent':float(counts[k]/len(base)*100),'sampleCount':int(sizes[k]),'samplePercent':float(sizes[k]/15000*100)} for k in counts.index],
      'coverage':coverage,'sources':provenance,
      'units':{'T':'kelvin','luminosity':'solar luminosities','lithium':'milliangstroms','wing':'dimensionless app-specific magnesium wing index','Dnu':'microhertz','numax':'microhertz','DPi1':'seconds'},
      'limitations':['Not a volume-complete Galactic census; young stars, remnants and rare classes are not separately represented.',
                    'Luminosity is calculated from published radius and effective temperature, L = R²(T/5772)⁴, not chosen to match a stage.',
                    'Broad reference classes share temperature/radius evidence with inference. Seismic reference stages share oscillation evidence; neither is independent truth.',
                    'No compatible observed magnesium wing indices in these catalogs. Abundance is not a substitute; all wing values are null.',
                    'Lithium catalog is detection-selected. Nondetections and absent records are not zero absorption.',
                    'Missing/limited/aliased data are stored without fabricated replacements. Random sampling does not filter on fit quality.',
                    'Catalog temperature/luminosity uncertainties are stored but not propagated by the exact-position app; relative fits are not calibrated probabilities.']}
    OUT.mkdir(exist_ok=True)
    (OUT/'observed-stars.json').write_text(json.dumps({'manifest':manifest,'stars':records},separators=(',',':'),allow_nan=False),encoding='utf-8')
    (OUT/'observed-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    db=sqlite3.connect(OUT/'observed-stars.sqlite')
    db.executescript('DROP TABLE IF EXISTS stars; DROP TABLE IF EXISTS metadata; CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE stars(kic INTEGER PRIMARY KEY, temperature REAL, luminosity REAL, magnesium REAL, lithium REAL, frequency_spacing REAL, peak_frequency REAL, period_spacing REAL, catalog_class TEXT, measurements_json TEXT);')
    db.executemany('INSERT INTO stars VALUES (?,?,?,?,?,?,?,?,?,?)',[(r['id'],r['T'],r['luminosity'],r['wing'],r['lithium'],r['Dnu'],r['numax'],r['DPi1'],r['catalogClass'],json.dumps(r,allow_nan=False)) for r in records])
    db.execute('INSERT INTO metadata VALUES (?,?)',('manifest',json.dumps(manifest)));db.commit();db.close()
    assert len(records)==15000 and len({r['id'] for r in records})==15000
    assert not {r['id'] for r in records}&training_ids
    print(json.dumps({'categories':manifest['categories'],'coverage':coverage,'trainingExcluded':manifest['excludedTrainingStars']},indent=2))

if __name__=='__main__': main()
