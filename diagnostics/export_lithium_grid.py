import os,sys,json,importlib.util
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parent.parent
base=root/'diagnostics/youth';os.chdir(base)
spec=importlib.util.spec_from_file_location('eagles',base/'eaglesv2_0.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
model=m.EWLi_Model(use_ML=True)
temps=np.arange(3000,6501,50,dtype=float)
ages=np.linspace(np.log10(2e6),np.log10(6e9),141)
rows=[]
for age in ages:
    mu=model.get_EWm(np.log10(temps),age);sigma=model.get_eEWm(np.log10(temps),age)
    rows.append([[round(float(a),5),round(float(b),5)] for a,b in zip(mu,sigma)])
out={'source':'https://github.com/robdjeff/eagles','paper':'https://arxiv.org/abs/2409.07523','commit':'84d1ec2747027e31ed63241c38409f726918e1e6','quantity':'Lithium 6708 angstrom equivalent width in milliangstroms; intrinsic dispersion included','temperatures':temps.tolist(),'ages':ages.tolist(),'rows':rows}
(root/'public/data/lithium-grid.json').write_text(json.dumps(out,separators=(',',':')))
print('Exported',len(ages)*len(temps),'forward predictions')
