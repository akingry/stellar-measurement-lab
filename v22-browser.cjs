const{chromium}=require('../stellar-properties-lab/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs');
const catalog=JSON.parse(fs.readFileSync('public/data/diagnostic-stars.json'));
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>{errors.push(String(e));console.error(String(e))});
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');if(errors.length)throw Error(errors.join('; '));await p.waitForFunction(()=>window.starLab?.ready&&starLab.modelReady,null,{timeout:120000});
 const wait=()=>p.waitForFunction(()=>starLab.modelReady,null,{timeout:60000});
 const load=async star=>{await p.evaluate(s=>starLab.loadObservedStar(s,true),star);await wait();return await p.evaluate(()=>({state:starLab.state,rows:starLab.ranking.rows.map(r=>({phase:r.phase,percent:r.percent})),comparison:document.getElementById('observedComparison').textContent}))};
 await p.locator('#randomExample').tap();await p.waitForFunction(()=>!!starLab.observed);await wait();assert.ok(catalog.stars.some(s=>s.id===null)===false);
 let id=await p.evaluate(()=>starLab.observed.id);assert.ok(catalog.stars.some(s=>s.id===id));
 const representatives=[...new Map(catalog.stars.map(s=>[s.exampleSetup.referenceCategory,s])).values()];
 const cases=[];
 for(const star of representatives){
  const a=await load(star);assert.equal(a.state.T,star.T);assert.ok(Math.abs(a.state.logL-Math.log10(star.luminosity))<1e-12);
  for(const key of ['lithium','wing','Dnu','numax','DPi1'])assert.equal(a.state[key],star[key]);
  assert.deepEqual(a.state.measurements,star.exampleSetup.measurements);
  assert.ok(a.rows.some(r=>r.percent!==null));assert.equal(await p.locator('#preview').isHidden(),true);
  const mutation=await load({...star,catalogClass:'Deliberately wrong reference',classCode:999,stageReference:{label:'Wrong',phases:[999]}});
  assert.deepEqual(mutation.rows,a.rows);
  await load(star);await p.locator('#candidateList button').first().tap();assert.equal(await p.locator('#preview').isVisible(),true);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  cases.push({id:star.id,category:star.exampleSetup.referenceCategory,rows:a.rows,comparison:a.comparison});
 }
 const dwarf=catalog.stars.find(s=>s.displayName==='Sirius B');await load(dwarf);assert.match(await p.locator('#candidateList').innerText(),/White-dwarf cooling/);
 assert.equal(await p.locator('#lithiumSlider').isDisabled(),true);await p.locator('#candidateList button').first().tap();
 const suffix=process.env.TEST_URL?'live':'browser';await p.screenshot({path:'validation/v22-'+suffix+'-white-dwarf.png',fullPage:true});
 const lithium=catalog.stars.find(s=>s.exampleSetup.measurements.includes('lithium'));await load(lithium);
 assert.equal(await p.locator('#lithiumPanel').isVisible(),true);
 await p.screenshot({path:'validation/v22-'+suffix+'-lithium.png',fullPage:true});
 const seismic=catalog.stars.find(s=>s.exampleSetup.measurements.includes('seismic'));await load(seismic);assert.equal(await p.locator('#seismicPanel').isVisible(),true);
 await p.locator('#randomStar').tap();await p.waitForFunction(id=>starLab.observed.id!==id,seismic.id);await wait();assert.equal(typeof await p.evaluate(()=>starLab.observed.id),'number');
 await p.locator('#reset').tap();await wait();assert.equal(await p.locator('#observedPanel').isHidden(),true);
 await p.goto(new URL('examples.html',p.url()).href);await p.waitForFunction(()=>document.getElementById('summary').textContent.includes('133'));
 assert.match(await p.locator('#categories').innerText(),/Pre-main sequence: 8/);assert.deepEqual(errors,[]);
 const out={passed:true,url:p.url(),checks:['recorded values preserved','reference-label mutation leaves prediction unchanged','diagnostic selection matches stored plan','white-dwarf cooling grid renders','missing measurements disabled','both Random buttons work','phone layout has no overflow'],cases};
 fs.writeFileSync('validation/v22-'+suffix+'.json',JSON.stringify(out,null,2));console.log(JSON.stringify({passed:true,url:p.url(),testedCategories:cases.length},null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
