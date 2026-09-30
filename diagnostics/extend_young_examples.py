"""Join observed young-star lithium to published stellar (not accretion) luminosity."""
from pathlib import Path
import hashlib,json,math,re
import pandas as pd
from astropy.io import ascii
ROOT=Path(__file__).resolve().parent.parent
folder=ROOT/'diagnostics/catalogs/young2026'
out=ROOT/'diagnostics/representative'
source=json.loads((out/'expanded-pool.json').read_text())
# Explicit transcription of Manara et al. 2021 Table 1, L_star in solar units.
# The source PDF is retained. No masses, ages or stage predictions enter inputs.
lum={'CVSO17':.30,'CVSO36':.22,'CVSO58':.32,'CVSO90':.13,'CVSO104':.37,
     'CVSO107':.32,'CVSO109':.92,'CVSO146':.80,'CVSO165':.98,'CVSO176':.34,
     'SO518':.24,'SO583':3.61,'SO1153':.17}
excluded={'CVSO104':'Spectroscopic binary','CVSO109':'Unresolved close binary','CVSO165':'Unresolved close binary'}
tables=[]
for name in ['tablea1.dat','tablea2.dat']:
    table=ascii.read(folder/name,format='cds',readme=str(folder/'ReadMe')).to_pandas()
    table['table']=name
    tables.append(table)
table=pd.concat(tables)
table['key']=table.Name.map(lambda n:re.sub(r'[^A-Z0-9]','',n.upper()))
# First observation by date, not strongest line or best classifier result.
table=table.sort_values(['Obs.Date','table']).drop_duplicates('key')
records=[]
for _,r in table.iterrows():
    key=r['key']
    if key not in lum or key in excluded:continue
    # Formal error propagation for EW_raw*(1+r650), retaining the published
    # corrected central value. Iron-correction/systematic uncertainty is unknown.
    sigma=math.hypot((1+r.r650)*r.e_EWLiraw,r.EWLiraw*r.e_r650)
    records.append({'id':'PENELLOPE:'+key,'displayName':key,'T':int(r.Teff),'temperatureError':int(r.e_Teff),
      'luminosity':lum[key],'luminosityError':None,'radius':None,
      'lithium':float(r['EWLiveil+Fe']),'lithiumError':sigma,'lithiumLimit':None,'wing':None,
      'Dnu':None,'numax':None,'DPi1':None,'periodSpacingError':None,'oscillationAlias':None,
      'spectralType':None,'catalogClass':'Pre-main sequence','classCode':-1,
      'stageReference':{'label':'Pre-main sequence (young-star survey)','phases':[-1],'source':'Manara2021/Carini2026',
         'independence':'Young-star reference uses cluster membership, accretion and spectral evidence; lithium is shared evidence, not fully independent truth.'},
      'binaryFlag':None,
      'measurementNotes':['Lithium corrected for veiling and, where applicable, iron blending. Milliangstrom units verified against paper; CDS unit metadata is malformed.',
         'Formal lithium error propagated from line-fit and veiling errors assuming independence; correction systematics and luminosity uncertainty are not provided here.',
         'Temperature and lithium use first high-resolution observation; luminosity comes from related X-Shooter observations. Variability can affect agreement.'],
      'provenance':{'lithium':{'catalog':'J/A+A/709/A144','table':r['table'],'name':r.Name,'date':r['Obs.Date'],'rawEW':float(r.EWLiraw),'veiling':float(r.r650)},
        'luminosity':{'url':'https://arxiv.org/abs/2103.12446','table':'1','column':'L_star','transcription':True}}})
assert len({r['id'] for r in records})==len(records)
source['stars']+=records
source['manifest']['count']=len(source['stars'])
source['manifest']['youngStarExtension']={'count':len(records),'excludedBinaries':excluded,
 'sources':[{'file':n,'sha256':hashlib.sha256((folder/n).read_bytes()).hexdigest()} for n in ['ReadMe','tablea1.dat','tablea2.dat','manara2021.pdf','carini2026.pdf']]}
(out/'expanded-with-young.json').write_text(json.dumps(source,separators=(',',':'),allow_nan=False))
print(json.dumps({'youngStars':len(records),'names':[r['displayName'] for r in records],'total':len(source['stars'])},indent=2))
