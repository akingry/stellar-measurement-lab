const {chromium}=require('../stellar-properties-lab/node_modules/playwright-core');
const fs=require('node:fs'),assert=require('node:assert/strict');
const stars=JSON.parse(fs.readFileSync('public/data/diagnostic-stars.json')).stars;
const reference=JSON.parse(fs.readFileSync('public/data/v25-validation.json')).records;
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>{errors.push(String(e));console.error(String(e))});
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await p.waitForFunction(()=>window.starLab?.ready&&starLab.modelReady,null,{timeout:120000});
 const load=async star=>{await p.evaluate(s=>starLab.loadObservedStar(s,true),star);await p.waitForFunction(()=>starLab.modelReady,null,{timeout:30000});return p.evaluate(()=>({state:starLab.state,rows:starLab.ranking.rows.map(r=>({phase:r.phase,percent:r.percent})),mode:starLab.inferenceMode}))};
 const cases=[4840662,7022298,9286266,'WD:Sirius B','PENELLOPE:CVSO17'];
 for(const id of cases){
  const star=stars.find(s=>s.id===id),r=await load(star),expected=reference.find(s=>s.id===id);
  assert.equal(r.state.T,star.T);assert.equal(r.state.lithium,star.lithium);assert.equal(r.state.DPi1,star.DPi1);
  assert.deepEqual(r.state.measurements,expected.measurements);
  assert.deepEqual(r.rows.map(x=>x.phase),expected.rows.map(x=>x.phase));
  r.rows.forEach((x,i)=>assert.ok(Math.abs(x.percent-expected.rows[i].percent)<1e-8));
  const mutated=await load({...star,classCode:999,catalogClass:'Wrong',stageReference:{phases:[999]},exampleSetup:{measurements:[]}});assert.deepEqual(mutated.rows,r.rows);
  await load(star);await p.locator('#candidateList button').first().tap();assert.equal(await p.locator('#preview').isVisible(),true);
  if(r.rows.length>1){await p.locator('#candidateList button').nth(1).tap();assert.equal(await p.evaluate(()=>starLab.selected),r.rows[1].phase)}
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 const both=JSON.parse(fs.readFileSync('public/data/observed-stars.json')).stars.find(s=>s.id===8017459);
 assert.ok(both);const joint=await load(both);assert.ok(joint.state.measurements.includes('lithium')&&joint.state.measurements.includes('seismic'));
 assert.ok(joint.rows.some(r=>r.percent>0));assert.equal(await p.locator('#lithiumPanel').isVisible(),true);assert.equal(await p.locator('#seismicPanel').isVisible(),true);
 const giant=stars.find(s=>s.id===4840662);await load(giant);assert.equal(await p.locator('#seismicPanel').isVisible(),true);assert.equal(await p.locator('.catalog-indicator.match').count(),1);
 const subgiant=stars.find(s=>s.id===7022298);await load(subgiant);assert.ok(await p.evaluate(()=>starLab.ranking.rows.find(r=>r.phase===2).percent>0));
 const previous=await p.evaluate(()=>starLab.ranking.rows.find(r=>r.phase===2).percent);
 await p.locator('#lithiumSlider').evaluate(el=>{el.value=Number(el.value)+30;el.dispatchEvent(new Event('input',{bubbles:true}))});
 assert.ok(Math.abs(await p.evaluate(()=>starLab.ranking.rows.find(r=>r.phase===2).percent)-previous)<1e-8);
 assert.match(await p.locator('.catalog-indicator').innerText(),/Measurements changed/);
 await p.locator('#TSlider').evaluate(el=>{el.value=Number(el.value)+.001;el.dispatchEvent(new Event('input',{bubbles:true}))});await p.waitForFunction(()=>starLab.modelReady);
 assert.equal(await p.evaluate(()=>starLab.state.observedMode),false);assert.equal(await p.evaluate(()=>starLab.inferenceMode),'point-interpolation');
 await load(subgiant);await p.locator('#candidateList').scrollIntoViewIfNeeded();const suffix=process.env.TEST_URL?'live':'browser';await p.screenshot({path:'validation/v25-'+suffix+'.png'});
 await p.locator('#randomStar').tap();await p.waitForFunction(()=>starLab.modelReady&&starLab.observed?.id!==7022298);assert.ok(await p.evaluate(()=>starLab.ranking.rows.length>0));
 await p.locator('#randomExample').tap();await p.waitForFunction(()=>starLab.modelReady&&!!starLab.observed?.exampleSetup);
 await p.locator('#reset').tap();await p.waitForFunction(()=>starLab.modelReady);assert.equal(await p.locator('#observedPanel').isHidden(),true);assert.equal(await p.locator('#candidateList .catalog-indicator').count(),0);
 assert.deepEqual(errors,[]);
 const result={passed:true,url:p.url(),cases,checks:['browser agrees with full-sample numerical validation','recorded measurements unchanged','reference labels and old setup cannot change predictions','evolved score survives lithium change','recovered giant uses recorded oscillations','white dwarf fallback preserved','young-star fallback preserved','both diagnostics enabled together','selection remains switchable','manual slider exploration returns to exact-point mode','both Random buttons work','phone no overflow']};
 fs.writeFileSync('validation/v25-'+suffix+'.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
