from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib,json,requests,subprocess
ROOT=Path(__file__).resolve().parent
BASE='https://akingry.github.io/stellar-measurement-lab/'
files=['index.html','app.js','candidate-worker.js','engine.js','cooling.js','data/diagnostic-stars.json','data/diagnostic-benchmark.sqlite','data/cooling-grid.json','data/observed-stars.json','data/observed-stars.sqlite']
def check(name):
    r=requests.get(BASE+name+'?v=22',timeout=30);r.raise_for_status()
    digest=hashlib.sha256(r.content).hexdigest()
    # Compare to deployed Git blobs, not Windows checkout CRLF conversions.
    expected=subprocess.check_output(['git','show','publish-v22:'+name],cwd=ROOT)
    assert digest==hashlib.sha256(expected).hexdigest(),name+' not current'
    return {'path':name,'bytes':len(r.content),'sha256':digest}
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(check,files))
report={'passed':True,'url':BASE+'?v=22','files':results}
(ROOT/'validation/v22-live-downloads.json').write_text(json.dumps(report,indent=2))
print('Verified',len(results),'live files, including both new and preserved databases.')
