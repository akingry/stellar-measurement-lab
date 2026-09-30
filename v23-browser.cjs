const {chromium}=require('../stellar-properties-lab/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');
  await p.waitForFunction(()=>window.starLab?.ready&&starLab.modelReady,null,{timeout:120000});
  const star=JSON.parse(fs.readFileSync('public/data/diagnostic-stars.json')).stars.find(s=>s.displayName==='Sirius B');
  const load=async s=>{await p.evaluate(s=>starLab.loadObservedStar(s,true),s);await p.waitForFunction(()=>starLab.modelReady);};
  await load(star);
  const rows=await p.evaluate(()=>starLab.ranking.rows.map(r=>[r.phase,r.percent]));
  assert.equal(await p.locator('.catalog-indicator.match').count(),1);
  await p.locator('#candidateList button').first().tap();
  assert.equal(await p.locator('.catalog-indicator.match').count(),1);
  await load({...star,stageReference:{phases:[999],label:'Deliberately incorrect reference'}});
  assert.equal(await p.locator('.catalog-indicator.mismatch').count(),1);
  assert.deepEqual(await p.evaluate(()=>starLab.ranking.rows.map(r=>[r.phase,r.percent])),rows);
  await p.locator('#TSlider').evaluate(el=>{el.value=Number(el.value)+.001;el.dispatchEvent(new Event('input',{bubbles:true}));});
  await p.waitForFunction(()=>starLab.modelReady);
  assert.match(await p.locator('.catalog-indicator').innerText(),/Measurements changed/);
  const neutral=await p.evaluate(async()=>{const {referenceIndicator}=await import('./observed.js?v=23');return [referenceIndicator({classCode:0},{rows:[{phase:0,percent:50},{phase:-1,percent:50}]}),referenceIndicator({classCode:1},{rows:[{phase:2,percent:100}]})]});
  assert.ok(neutral.every(x=>x.status==='neutral'));
  await load(star);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await p.locator('#candidateList').scrollIntoViewIfNeeded();
  const suffix=process.env.TEST_URL?'live':'browser';
  await p.screenshot({path:'validation/v23-'+suffix+'.png'});
  await p.locator('#reset').tap();await p.waitForFunction(()=>starLab.modelReady);
  assert.equal(await p.locator('.catalog-indicator').count(),0);
  assert.deepEqual(errors,[]);
  const result={passed:true,url:p.url(),checks:['match','mismatch','reference does not alter prediction','edited measurements neutral','ties neutral','incomparable stages neutral','selection preserves badge','reset clears badge','phone overflow']};
  fs.writeFileSync('validation/v23-'+suffix+'.json',JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
