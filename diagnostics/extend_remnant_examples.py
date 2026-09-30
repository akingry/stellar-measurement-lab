"""Observed compact-star benchmarks; no dynamical masses enter inference."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parent.parent
out=ROOT/'diagnostics/representative'
source=json.loads((out/'expanded-with-young.json').read_text())
rows=[('Procyon B','DQZ',7740,50,.01232,.00032,None,None),
      ('Sirius B','DA2',25369,46,.008098,.000046,.02448,.00033),
      ('Stein 2051 B','DC',7122,181,.0114,.0004,None,None),
      ('40 Eridani B','DA2.9',17200,110,.01308,.00020,.01349,.00054)]
for name,spectral,T,eT,R,eR,L,eL in rows:
    derived=L is None
    if derived:L=R**2*(T/5772)**4
    source['stars'].append({'id':'WD:'+name,'displayName':name,'T':T,'temperatureError':eT,'radius':R,
      'luminosity':L,'luminosityError':eL,'lithium':None,'lithiumError':None,'lithiumLimit':None,
      'wing':None,'Dnu':None,'numax':None,'DPi1':None,'periodSpacingError':None,'oscillationAlias':None,
      'catalogClass':'White dwarf','classCode':6,'spectralType':spectral,'binaryFlag':1,
      'stageReference':{'label':'White-dwarf cooling','phases':[10],'source':'Bond2017',
        'independence':'White-dwarf spectral reference; cooling-grid temperature and luminosity inference is separate. Observed spectrum/flux contributes to both reference and input measurements.'},
      'measurementNotes':['Temperature and photospheric radius from published spectrum/flux-distance analysis; resolved binary component. Dynamical mass is not an input.',
        'Luminosity calculated from published radius and temperature.' if derived else 'Published luminosity used without adjustment.',
        'Published internal errors do not include all systematic errors.'],
      'provenance':{'url':'https://arxiv.org/abs/1709.00478','table':'1','luminosityDerivedFromRadiusAndTemperature':derived}})
source['manifest']['count']=len(source['stars'])
source['manifest']['remnants']={'count':len(rows),'pdfSha256':hashlib.sha256((ROOT/'diagnostics/catalogs/white-dwarf-benchmarks/40eri2017.pdf').read_bytes()).hexdigest()}
(out/'expanded-with-remnants.json').write_text(json.dumps(source,separators=(',',':'),allow_nan=False))
print('Added four observed white-dwarf benchmarks; original 15,000 database unchanged.')
