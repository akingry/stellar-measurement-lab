"""Retain published late-stage benchmarks even if the app cannot distinguish them."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent.parent
folder=ROOT/'diagnostics/representative'
d=json.loads((folder/'expanded-with-remnants.json').read_text())
records=[
 {'id':'LATE:R Sculptoris','displayName':'R Sculptoris','T':2640,'temperatureError':80,'luminosity':10**3.74,'logLuminosityError':.18,
  'catalogClass':'Carbon-rich asymptotic giant branch','classCode':5,
  'stageReference':{'label':'Carbon-rich asymptotic giant branch','phases':[4,5],'source':'Wittkowski2017',
    'independence':'Published asymptotic-giant classification and observed detached-shell history; this comparison does not assert a specific moment in the thermal-pulse cycle.'},
  'provenance':{'url':'https://arxiv.org/abs/1702.02574','quantities':'Measured effective temperature and logarithmic luminosity, abstract and stellar-parameter table'},
  'measurementNotes':['Interferometric temperature and bolometric luminosity; pulsation variability and substantial distance uncertainty apply.']},
 {'id':'LATE:J005252.87-722842.9','displayName':'J005252.87-722842.9','T':8250,'temperatureError':250,'luminosity':8200,'luminosityError':700,
  'catalogClass':'Post-asymptotic giant branch','classCode':6,
  'stageReference':{'label':'Likely post-asymptotic giant branch','phases':[6],'source':'Kamath2017',
    'independence':'Published likely classification using luminosity, chemistry and spectroscopy; not a directly observed nuclear-burning state.'},
  'provenance':{'url':'https://arxiv.org/abs/1710.04368','quantities':'Effective temperature and bolometric luminosity from abstract'},
  'measurementNotes':['Published likely post-asymptotic-giant star. No carbon enrichment or neutron-capture enrichment assumed.']}
]
for r in records:
    for k in ['lithium','lithiumError','lithiumLimit','wing','Dnu','numax','DPi1','periodSpacingError','oscillationAlias','spectralType','binaryFlag']:r.setdefault(k,None)
    d['stars'].append(r)
d['manifest']['count']=len(d['stars'])
d['manifest']['lateExamples']=[r['provenance'] for r in records]
(folder/'expanded-all.json').write_text(json.dumps(d,separators=(',',':'),allow_nan=False))
print('Added two late-stage observed benchmarks; no predicted labels used.')
