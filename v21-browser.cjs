const{chromium}=require('../stellar-properties-lab/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('fs');
const catalog=JSON.parse(fs.readFileSync('public/data/observed-stars.json'));
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await p.waitForFunction(()=>starLab.ready&&starLab.modelReady,null,{timeout:120000});
 const wait=()=>p.waitForFunction(()=>starLab.modelReady,null,{timeout:60000});
 const state=()=>p.evaluate(()=>({q:starLab.state,rows:starLab.ranking.rows.map(r=>({phase:r.phase,percent:r.percent})),observed:starLab.observed}));
 const load=async s=>{await p.evaluate(s=>starLab.loadObservedStar(s),s);await wait();const q=(await state()).q;assert.equal(q.T,s.T);assert.ok(Math.abs(q.logL-Math.log10(s.luminosity))<1e-14);for(const k of ['wing','lithium','Dnu','numax','DPi1'])assert.equal(q[k],s[k]);assert.equal(q.classCode,undefined);assert.equal(q.stageReference,undefined);return q};
 await p.locator('#randomStar').tap();await p.waitForFunction(()=>!!starLab.observed);await wait();let a=await state();assert.ok(catalog.stars.some(s=>s.id===a.observed.id));assert.equal(a.q.T,a.observed.T);assert.equal(a.q.wing,null);assert.equal(a.q.measurements.includes('spectrum'),false);
 const missing=catalog.stars.find(s=>s.lithium===null&&s.DPi1===null&&s.numax===null);assert.deepEqual((await load(missing)).measurements,[]);
 assert.equal(await p.locator('#wingSlider').isDisabled(),true);assert.equal(await p.locator('#lithiumSlider').isDisabled(),true);
 const lithium=catalog.stars.find(s=>s.lithium!==null&&!s.lithiumLimit&&s.classCode===0);assert.ok((await load(lithium)).measurements.includes('lithium'));
 assert.equal((await state()).q.lithiumError,lithium.lithiumError);
 const limits=catalog.stars.find(s=>s.lithiumLimit);assert.ok(!(await load(limits)).measurements.includes('lithium'));
 const seismic=catalog.stars.find(s=>s.DPi1&&s.numax&&s.oscillationAlias===0&&s.stageReference);assert.ok((await load(seismic)).measurements.includes('seismic'));
 const before=(await state()).rows;await load({...seismic,catalogClass:'Wrong reference for leakage test',classCode:0,stageReference:{label:'Wrong label',phases:[-1]}});assert.deepEqual((await state()).rows,before);
 // Reference mismatch never changes the prediction; restore the real record.
 await load(seismic);await p.screenshot({path:'validation/v21-'+(process.env.TEST_URL?'live-':'')+'record.png',fullPage:true});
 await p.locator('#TSlider').evaluate(e=>{e.value=Number(e.value)+.0001;e.dispatchEvent(new Event('input'))});await wait();assert.match(await p.locator('#observedComparison').innerText(),/Exploration/);
 await p.locator('#reset').tap();await wait();assert.equal(await p.locator('#observedPanel').isHidden(),true);assert.equal(await p.locator('#lithiumSlider').isDisabled(),false);assert.equal((await state()).q.T,5772);
 await p.locator('#spectrumChoice').tap();assert.equal(await p.locator('#wingSlider').isDisabled(),false);
 const pure=await p.evaluate(async()=>{const{compareReference,observedMeasurements}=await import('./observed.js?v=21');const s={classCode:0};return {disagree:compareReference(s,{rows:[{phase:3,percent:100}],partial:false}),tie:compareReference(s,{rows:[{phase:0,percent:50},{phase:-1,percent:50}]}),empty:compareReference(s,{rows:[]}),missing:observedMeasurements({T:5772,luminosity:1,lithium:null,wing:null,Dnu:null,numax:null,DPi1:null}).measurements}});
 assert.match(pure.disagree,/Disagrees/);assert.match(pure.tie,/Unresolved/);assert.match(pure.empty,/Not testable/);assert.deepEqual(pure.missing,[]);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 const out={passed:true,url:p.url(),records:{missing:missing.id,lithium:lithium.id,limit:limits.id,seismic:seismic.id},checks:['random selects a catalog member without fit filtering','exact observed inputs preserved','missing measurements null and excluded','upper limits excluded','observed lithium error used','reference mutation leaves ranking identical','edited observations no longer reported as original test','reset restores exploration','ties and disagreement remain visible','phone no overflow or browser errors']};
 fs.writeFileSync('validation/v21-'+(process.env.TEST_URL?'live':'browser')+'.json',JSON.stringify(out,null,2));console.log(out);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
