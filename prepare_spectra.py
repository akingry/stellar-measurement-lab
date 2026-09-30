"""Reproducible measured magnesium wing index from published 2024 spectra."""
import concurrent.futures, gzip, hashlib, json, pathlib, re, urllib.request
import numpy as np
ROOT=pathlib.Path(__file__).parent
CACHE=ROOT/'raw/spectra'; CACHE.mkdir(parents=True,exist_ok=True)
BASE='https://archive.stsci.edu/hlsps/bosz/bosz2024/'
def get(url,path):
    if not path.exists():
        for attempt in range(4):
            try:
                data=urllib.request.urlopen(url,timeout=90).read();path.write_bytes(data);break
            except Exception:
                if attempt==3: raise
    return path.read_bytes()
wave=np.loadtxt(get(BASE+'wavelength_grids/bosz2024_wave_r10000.txt',CACHE/'wave.txt').decode().splitlines())/10
bands=[(518.1104,518.3104),(518.4104,518.6104)]
temps={3500,4000,4500,5000,5500,5750,6000,6500,7000,7500}
jobs=[]
for z in [-2,-1.5,-1,-.5,0,.5]:
    tag=f'{z:+.2f}'
    script=get(BASE+f'download_scripts/hlsp_bosz_bosz2024_sim_r10000_m{tag}_v1_bulkdl.sh',CACHE/f'download{tag}.txt').decode()
    for url in re.findall(r'https://[^\s"\']+resam.txt.gz',script):
        m=re.search(r'bosz2024_(ms|mp)_t(\d+)_g([+-][\d.]+)_m([+-][\d.]+)_a\+0.00_c\+0.00_v2_',url)
        if m and int(m[2]) in temps: jobs.append((url,int(m[2]),float(m[3]),float(m[4])))
def work(job):
    url,t,g,z=job;name=url.rsplit('/',1)[-1]
    data=get(url,CACHE/name)
    a=np.loadtxt(gzip.decompress(data).decode().splitlines())
    assert len(a)==len(wave) and a.shape[1]==2
    norm=a[:,0]/a[:,1]
    index=0
    for lo,hi in bands:
        xx=np.r_[lo,wave[(wave>lo)&(wave<hi)],hi]
        index+=float(np.trapezoid(1-np.interp(xx,wave,norm),xx))
    return {'temperature':t,'gravity':g,'metallicity':z,'index':index,'source':name,'sha256':hashlib.sha256(data).hexdigest()}
rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    for row in pool.map(work,jobs):
        rows.append(row)
        if len(rows)%25==0: print(f'{len(rows)}/{len(jobs)} spectra',flush=True)
out={'source':'https://arxiv.org/abs/2407.10872','archive':BASE,'bandsNanometersAir':bands,'resolvingPower':10000,'microturbulenceKilometersPerSecond':2,'alphaEnhancement':0,'carbonEnhancement':0,'rows':sorted(rows,key=lambda r:(r['metallicity'],r['temperature'],r['gravity']))}
(ROOT/'public/data/spectral-index.json').write_text(json.dumps(out,separators=(',',':')))
print('Saved',len(rows),'spectra',flush=True)
