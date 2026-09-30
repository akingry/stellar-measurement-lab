"""Download source metadata for additional stage-specific reference populations."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,requests
root=Path(__file__).resolve().parent/'catalogs'
sources={'young2026':'J/A+A/709/A144','galahlithium2019':'J/MNRAS/484/4591'}
def fetch(item):
    name,catalog=item
    url=f'https://cdsarc.cds.unistra.fr/ftp/{catalog}/ReadMe'
    response=requests.get(url,timeout=25);response.raise_for_status()
    folder=root/name;folder.mkdir(exist_ok=True)
    (folder/'ReadMe').write_bytes(response.content)
    return {'name':name,'url':url,'sha256':hashlib.sha256(response.content).hexdigest()}
with ThreadPoolExecutor(max_workers=2) as pool:
    results=list(pool.map(fetch,sources.items()))
(root/'extension-provenance.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
