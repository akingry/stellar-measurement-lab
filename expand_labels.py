from pathlib import Path
root=Path(__file__).parent/'public'
replacements={
'Post-main sequence / RGB':'Post-main sequence / red giant branch',
'Early AGB':'Early asymptotic giant branch',
'Thermally pulsing AGB':'Thermally pulsing asymptotic giant branch',
'Post-AGB / WD cooling':'Post-asymptotic giant branch / white dwarf cooling',
'post-AGB':'post-asymptotic giant branch',
'Post-AGB':'Post-asymptotic giant branch',
'H–R diagram':'Hertzsprung–Russell diagram',
'H–R plane':'Hertzsprung–Russell diagram',
'H–R position':'Hertzsprung–Russell position',
'post-main-sequence/RGB':'post-main-sequence/red giant branch',
'CIE 1931':'International Commission on Illumination 1931',
'analytic CIE fits':'analytic color-matching fits',
'CIE approximation':'Color-matching approximation',
}
for filename in ['engine.js','index.html','app.js']:
    p=root/filename;s=p.read_text(encoding='utf-8')
    for old,new in replacements.items():s=s.replace(old,new)
    if filename=='app.js':
        s=s.replace("from './engine.js'","from './engine.js?v=6'")
        s=s.replace("unit:'K'","unit:'kelvin'").replace("unit:'L☉'","unit:'solar luminosities'")
        s=s.replace("+' R☉'","+' solar radii'").replace("+' M☉'","+' solar masses'")
        s=s.replace('} M☉</small>','} solar masses</small>')
        s=s.replace("+' K'","+' kelvin'").replace("+' nm'","+' nanometers'")
        s=s.replace("'SUN · 1 R☉'","'SUN'").replace("'L / L☉'","'Solar luminosities'")
        s=s.replace('MIST 1.2 / MESA 7503','Modules for Experiments in Stellar Astrophysics Isochrones and Stellar Tracks, version 1.2')
        s=s.replace('All tabulated EEPs','All tabulated equivalent evolutionary points')
    if filename=='index.html':
        s=s.replace('style.css?v=5','style.css?v=6').replace('app.js?v=5','app.js?v=6')
        s=s.replace('EEP nodes','equivalent evolutionary point nodes').replace('and adjacent EEP','and adjacent equivalent evolutionary point')
        s=s.replace('MIST 1.2','Modules for Experiments in Stellar Astrophysics Isochrones and Stellar Tracks, version 1.2')
        s=s.replace('MIST grid download','Stellar evolution grid download')
    p.write_text(s,encoding='utf-8')
p=root/'style.css';s=p.read_text(encoding='utf-8');s+='\n.stage-chip{max-width:100%;overflow-wrap:break-word}.legend span{line-height:1.5}.readings strong{font-size:16px}.control-head small{display:inline-block}\n';p.write_text(s,encoding='utf-8')
