from pathlib import Path
import time, hashlib, json, requests
base='https://akingry.github.io/stellar-measurement-lab/'
files=['index.html','app.js','style.css','details.html','evidence.js','data/evidence.json','guidance.js','candidate-worker.js']
def digest(content):
    # Git normalizes Windows checkout CRLF to LF in the published tree.
    return hashlib.sha256(content.replace(b'\r\n',b'\n')).hexdigest()
start=time.monotonic()
while time.monotonic()-start<180:
    r=requests.get(base+'app.js?v=11-check',timeout=15)
    if r.ok and digest(r.content)==digest(Path('public/app.js').read_bytes()):
        break
    time.sleep(8)
else:
    raise SystemExit('Deployment not yet matched')
result={}
for f in files:
    r=requests.get(base+f+'?v=11-verified',timeout=20);r.raise_for_status()
    checksum=digest(r.content)
    assert checksum==digest((Path('public')/f).read_bytes()),f
    result[f]=checksum
Path('validation/v11-live-assets.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print('Verified eight live text assets against local SHA256 hashes after CRLF normalization.')
