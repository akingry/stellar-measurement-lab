"""Additional observed spectrum-derived constraints, not reference labels."""
import sys,json,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from build_observed import read,ROOT
d=read('frasca2022','table2.dat')
stars=json.loads((ROOT/'public/data/diagnostic-stars.json').read_text())['stars']
out={}
for s in stars:
    if not isinstance(s['id'],int):continue
    target='KIC'+str(s['id']).zfill(8)
    rows=d[d.KIC==target]
    if len(rows)!=1:continue
    row=rows.iloc[0]
    def f(k):
        v=float(row[k]);return v if math.isfinite(v) else None
    out[str(s['id'])]={'temperature':f('Teff'),'temperatureError':f('e_Teff'),'logGravity':f('logg'),'logGravityError':f('e_logg'),'ironAbundance':f('[Fe/H]'),'ironAbundanceError':f('e_[Fe/H]'),
    'source':'https://cdsarc.cds.unistra.fr/ftp/J/A+A/664/A78/table2.dat',
    'note':'Atmosphere-model inference from spectra, not raw line measurements. For audit-only tests; not silently inserted into app sliders.'}
(ROOT/'diagnostics/mismatch-audit/spectroscopy.json').write_text(json.dumps(out,indent=2,allow_nan=False))
print('Spectrum-derived measurements:',len(out))
