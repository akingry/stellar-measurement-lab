"""Cache published Montreal compact-star grids, with no observed-star fitting."""
from pathlib import Path
import hashlib,json,math,requests
ROOT=Path(__file__).resolve().parent.parent
folder=ROOT/'diagnostics/catalogs/montreal2020';folder.mkdir(exist_ok=True)
grids=[]
for name in ['DA','DB']:
    url='https://www.astro.umontreal.ca/~bergeron/CoolingModels/Tables/Table_'+name
    path=folder/('Table_'+name)
    if not path.exists():
        r=requests.get(url,timeout=25);r.raise_for_status();path.write_bytes(r.content)
    rows=[]
    for line in path.read_text().splitlines()[2:]:
        if not line.strip():continue
        a=[float(x) for x in line.split()]
        T,g,mass=a[:3];age=a[-1]
        # Model R^2=GM/g, then L=4 pi sigma R^2 T^4. This avoids guessing the
        # bolometric zero point used in the source magnitude column.
        L=4*math.pi*5.670374419e-8*(6.67430e-11*mass*1.98847e30/(10**g/100))*T**4/3.828e26
        rows.append([math.log10(T),math.log10(L),mass,math.log10(age) if age>0 else None,g])
    grids.append({'atmosphere':name,'source':url,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'rows':rows})
data={'source':'https://www.astro.umontreal.ca/~bergeron/CoolingModels/',
 'reference':'Bedard et al. 2020, ApJ 901, 93',
 'columns':['logTemperature','logLuminosity','currentMass','logCoolingAge','logGravity'],
 'notes':['Carbon-oxygen-core model family, pure hydrogen/thick-layer and pure helium/thin-layer atmospheres.',
          'Luminosity reconstructed from rounded published model mass, gravity and temperature; small rounding errors apply.',
          'Cooling age is not total stellar age. No initial mass or initial metallicity is inferred.',
          'Grid coverage is not exhaustive of compact-star composition or formation channels.'], 'grids':grids}
(ROOT/'public/data/cooling-grid.json').write_text(json.dumps(data,separators=(',',':'),allow_nan=False))
print('Saved',sum(len(g['rows']) for g in grids),'published cooling-grid rows.')
