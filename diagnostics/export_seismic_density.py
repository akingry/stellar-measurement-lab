from pathlib import Path
import pandas as pd,numpy as np,json
from scipy.stats import gaussian_kde
p=Path(__file__).resolve().parent
d=pd.read_csv(p/'mixed-mode-consensus-cohort.csv');d=d[d.partition=='train']
out={'method':'Gaussian kernel density, Scott bandwidth; equal per-stage weighting. Conditional fit shares, not calibrated stage probabilities.','groups':{}}
for label,df in d.groupby('label'):
 x=np.array([np.log10(df.Dnu),np.log10(df.numax),df.DPi1]);k=gaussian_kde(x)
 out['groups'][str(label)]={'x':x.T.tolist(),'inverse':k.inv_cov.tolist(),'normalizer':float(np.sqrt(np.linalg.det(k.covariance)))}
(p.parent/'public/data/seismic-density.json').write_text(json.dumps(out,separators=(',',':')))
