from pathlib import Path
import tarfile,re,json,gzip,hashlib,math,time
import numpy as np
root=Path(__file__).resolve().parent;out=root/'public'/'data';out.mkdir(parents=True,exist_ok=True)
archive=root/'raw'/'MIST_v1.2_vvcrit0.0_basic_isos.txz'
manifest={'source':'https://mist.science/data/tarballs_v1.2/MIST_v1.2_vvcrit0.0_basic_isos.txz','source_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'version':'MIST 1.2 / MESA 7503','rotation':0,'alpha_enhancement':0,'columns':['log_Teff','log_L','log_g','surface_MH','star_mass','log_age_yr','initial_mass','phase','EEP'],'dtype':'little-endian float32','files':[],'filters':'Initial [Fe/H] -2.0 to +0.5 inclusive; ages <=13.8 Gyr; all EEP rows retained. No interpolation or phase thinning.','surface_MH_definition':'log10((1-X_H1-X_He3-X_He4)/X_H1) - log10(0.0142857/0.7154143). Bulk surface metals/H, not spectroscopic [Fe/H].','phase_names':{'-1':'Pre-main sequence','0':'Main sequence','2':'Post-main sequence / RGB','3':'Core helium burning','4':'Early asymptotic giant branch','5':'Thermally pulsing AGB','6':'Post-AGB / white-dwarf cooling','9':'Wolf–Rayet flag'}}
examples=[];max_rad=0.;max_mass=0.
with tarfile.open(archive,'r|xz') as tf:
    for entry in tf:
        m=re.search(r'feh_([mp])(\d+\.\d+).*\.iso$',entry.name)
        if not m:continue
        feh=float(m[2])*(-1 if m[1]=='m' else 1)
        if feh< -2 or feh>.5:continue
        f=tf.extractfile(entry)
        raw=np.loadtxt(f,comments='#',dtype=np.float64)
        assert raw.shape[1]==25
        raw=raw[raw[:,1]<=math.log10(13.8e9)]
        z=1-raw[:,13]-raw[:,14]-raw[:,15]
        valid=(z>0)&(raw[:,13]>0)&(raw[:,3]>0)
        assert (raw[:,3]>0).all()
        mh=np.full(len(raw),99.)
        mh[valid]=np.log10(z[valid]/raw[valid,13])-math.log10(.0142857/.7154143)
        radius=(10**raw[:,7]*3.828e26/(4*np.pi*5.670374419e-8*(10**raw[:,10])**4))**.5/6.957e8
        gravity=np.log10(6.67430e-11*raw[:,3]*1.98847e30/(radius*6.957e8)**2*100)
        arr=np.column_stack([raw[:,10],raw[:,7],gravity,mh,raw[:,3],raw[:,1],raw[:,2],raw[:,24],raw[:,0]]).astype('<f4')
        assert np.isfinite(arr).all()
        phases,cnts=np.unique(arr[:,7],return_counts=True)
        assert all(str(int(x)) in manifest['phase_names'] and x==int(x) for x in phases)
        radius=(10**raw[:,7]*3.828e26/(4*np.pi*5.670374419e-8*(10**raw[:,10])**4))**.5/6.957e8
        rad_diff=np.max(np.abs(radius/(10**raw[:,11])-1))
        mass=((10**raw[:,12])/100*(radius*6.957e8)**2/6.67430e-11/1.98847e30)
        mass_diff=np.max(np.abs(mass/raw[:,3]-1))
        max_rad=max(max_rad,float(rad_diff));max_mass=max(max_mass,float(mass_diff))
        name='mist_'+('m' if feh<0 else 'p')+f'{abs(feh):.2f}'+'.bin.gz'
        payload=gzip.compress(arr.tobytes(),compresslevel=9,mtime=0);(out/name).write_bytes(payload)
        manifest['files'].append({'name':name,'initial_feh':feh,'rows':len(arr),'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest(),'surface_MH_unavailable_rows':int((~valid).sum()),'phases':{str(int(p)):int(n) for p,n in zip(phases,cnts)}})
        if feh==0:
            targets=[('Sun-like',0,5772,1),('Young star',-1,4200,2),('Red giant',2,4200,100),('Helium-burning',3,4800,60),('AGB star',5,3300,3000),('Hot remnant',6,15000,.01)]
            for name,phase,t,l in targets:
                inds=np.flatnonzero(arr[:,7]==phase)
                distance=((arr[inds,0]-math.log10(t))/.05)**2+((arr[inds,1]-math.log10(l))/.4)**2
                idx=inds[np.argmin(distance)];examples.append({'name':name,'row':arr[idx].astype(float).tolist(),'source_file':entry.name,'row_index_after_age_filter':int(idx)})
        print(f'{feh:+.2f}: {len(arr)} rows, {len(payload)/1e6:.2f} MB, phases {phases.tolist()}',flush=True)
manifest['files'].sort(key=lambda x:x['initial_feh'])
manifest['total_rows']=sum(x['rows'] for x in manifest['files']);manifest['total_bytes']=sum(x['bytes'] for x in manifest['files'])
manifest['columns'][2]='log_g_gravitational'
manifest['gravity_definition']='Gravitational log g (cgs) recomputed from published star_mass and Stefan–Boltzmann radius using the app constants. Raw MIST isochrone log_g is NOT used: its separately tabulated/interpolated values do not always satisfy GM/R² with the other columns.'
manifest['validation']={'max_relative_radius_difference_from_MIST':max_rad,'max_relative_mass_difference_if_raw_MIST_log_g_were_used':max_mass,'note':'The radius agrees to ~0.006%. Raw tabulated log_g can yield mass discrepancies up to ~32%; therefore gravity is recomputed consistently from model mass and radius, and this transformation is explicit.'}
manifest['examples']=examples
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('COMPLETE',manifest['total_rows'],manifest['total_bytes'],manifest['validation'],flush=True)
