"""Export the existing held-out-tested tree and empirical coverage envelopes."""
from pathlib import Path
import json, hashlib
import numpy as np
import pandas as pd
from scipy.spatial import ConvexHull
from sklearn.tree import DecisionTreeClassifier

ROOT = Path(__file__).resolve().parent
df = pd.read_csv(ROOT/'mixed-mode-consensus-cohort.csv')
cols = ['Dnu', 'numax', 'DPi1']
train = df[df.partition == 'train']; test = df[df.partition == 'test']
model = DecisionTreeClassifier(max_depth=4, min_samples_leaf=10, random_state=20260930)
model.fit(train[cols].to_numpy(), train.label)
pred = model.predict(test[cols].to_numpy())
old = pd.read_csv(ROOT/'mixed-mode-consensus-plus_period_spacing-tree-predictions.csv')
assert dict(zip(test.KIC,pred)) == dict(zip(old.KIC,old.prediction))

def envelope(x):
    x=np.array(x,float); lo=x.min(axis=0); scale=np.ptp(x,axis=0)
    assert (scale>0).all()
    return {'offset':lo.tolist(),'scale':scale.tolist(),
            'planes':ConvexHull((x-lo)/scale).equations.tolist()}

t=model.tree_
data={'version':10,'seismic':{
    'features':cols,'trainingCount':len(train),'testCount':len(test),
    'testDisagreements':int((pred!=test.label).sum()),
    'labels':{'1':'Shell-burning giant','2':'Core helium burning'},
    'caveat':'Class 1 combines red and asymptotic giants. Reference labels share seismic evidence. Not a joint temperature/luminosity fit or independent physical validation.',
    'bounds':{c:[float(train[c].min()),float(train[c].max())] for c in cols},
    'envelope':envelope(np.column_stack([np.log10(train.Dnu),np.log10(train.numax),train.DPi1])),
    'tree':{'feature':t.feature.tolist(),'threshold':t.threshold.tolist(),
            'left':t.children_left.tolist(),'right':t.children_right.tolist(),
            'label':[int(model.classes_[np.argmax(v)]) for v in t.value]},
    'examples':[{'Dnu':float(r.Dnu),'numax':float(r.numax),'DPi1':float(r.DPi1),'label':int(r.label)}
                for label in [1,2] for _,r in train[train.label==label].iloc[[0]].iterrows()],
    'sources':['https://arxiv.org/abs/1103.5805','https://cdsarc.cds.unistra.fr/ftp/J/A+A/588/A87/ReadMe','https://arxiv.org/abs/2411.03101']},
    'technetium':{'groups':{},'caveat':'In-sample feature envelopes only; uncertainties unavailable. Rich does not uniquely determine a stage; poor does not exclude thermal pulses.',
                 'source':'https://arxiv.org/html/2507.20812v1'}}
tc=pd.read_csv(ROOT/'catalogs/shetye2025/measured-features.csv')
for label, group in tc.groupby('reference_feature_label'):
    points=group[['blend_center_4238_angstrom','blend_center_4262_angstrom']].to_numpy()
    data['technetium']['groups'][label]={'count':len(group),'envelope':envelope(points),'example':points.mean(axis=0).tolist()}
data['technetium']['bounds']={c:[float(tc[c].min()),float(tc[c].max())] for c in ['blend_center_4238_angstrom','blend_center_4262_angstrom']}
data['inputHashes']={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'mixed-mode-consensus-cohort.csv',ROOT/'catalogs/shetye2025/measured-features.csv']}
(ROOT.parent/'public/data/evidence.json').write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
print(f'Exported {len(train)} training stars; {len(test)} held-out predictions reproduced; {len(tc)} technetium observations.')
