from pathlib import Path
import requests, re, time
root=Path(__file__).resolve().parent
raw=root/'raw';raw.mkdir(exist_ok=True)
url='https://mist.science/model_grids.html'
r=requests.get(url,timeout=45);r.raise_for_status()
links=re.findall(r'href=[\"\x27]([^\"\x27]+)',r.text)
for link in links:
    if 'basic' in link and '0.0' in link: print('DATA_URL',link,flush=True)
(raw/'model_grids.html').write_text(r.text,encoding='utf-8')
for name in ['README_tables.pdf','README_overview.pdf']:
    r=requests.get('https://mist.science/'+name,timeout=45);r.raise_for_status();(raw/name).write_bytes(r.content)
    try:
        import fitz
        doc=fitz.open(raw/name)
        (raw/(name+'.txt')).write_text('\n'.join(page.get_text() for page in doc),encoding='utf-8')
    except ImportError: pass
