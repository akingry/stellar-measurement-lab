from pathlib import Path
import requests,time,hashlib,tarfile
root=Path(__file__).resolve().parent
dest=root/'raw'/'MIST_v1.2_vvcrit0.0_basic_isos.txz'
url='https://mist.science/data/tarballs_v1.2/MIST_v1.2_vvcrit0.0_basic_isos.txz'
if not dest.exists():
    part=dest.with_suffix('.partial')
    with requests.get(url,stream=True,timeout=(30,90)) as r:
        r.raise_for_status();n=0;last=time.time()
        with part.open('wb') as f:
            for block in r.iter_content(1024*1024):
                f.write(block);n+=len(block)
                if time.time()-last>10: print(f'Downloaded {n/1e6:.1f} MB',flush=True);last=time.time()
    part.rename(dest)
print('SHA256',hashlib.sha256(dest.read_bytes()).hexdigest(),flush=True)
with tarfile.open(dest,'r:xz') as tf:
    for m in tf:
        if m.name.endswith('.iso'):
            print(m.name,m.size,flush=True)
            if 'feh_p0.00' in m.name:
                f=tf.extractfile(m)
                for _ in range(18): print(f.readline().decode().rstrip(),flush=True)
                break
