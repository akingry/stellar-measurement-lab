const {chromium}=require('../stellar-properties-lab/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[],requests=[];p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>requests.push(r.url()));
await p.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await p.waitForFunction(()=>window.starLab?.ready&&starLab.modelReady,null,{timeout:120000});
assert.equal(await p.locator('#randomStar').count(),0);assert.equal(await p.locator('#randomExample').isVisible(),true);
const stars=JSON.parse(fs.readFileSync('public/data/diagnostic-stars.json')).stars,ref=JSON.parse(fs.readFileSync('public/data/v25-validation.json')).records;
for(const id of [4840662,7022298,'WD:Sirius B','PENELLOPE:CVSO17']){
const s=stars.find(x=>x.id===id);await p.evaluate(s=>starLab.loadObservedStar(s,true),s);await p.waitForFunction(()=>starLab.modelReady);
const rows=await p.evaluate(()=>starLab.ranking.rows.map(r=>({phase:r.phase,percent:r.percent})));const expected=ref.find(x=>x.id===id);assert.deepEqual(rows.map(x=>x.phase),expected.rows.map(x=>x.phase));rows.forEach((x,i)=>assert.ok(Math.abs(x.percent-expected.rows[i].percent)<1e-8));
await p.locator('#resultTab').tap();await p.locator('#candidateList button').first().tap();assert.equal(await p.locator('#preview').isVisible(),true);if(rows.length>1){await p.locator('#candidateList button').nth(1).tap();assert.equal(await p.evaluate(()=>starLab.selected),rows[1].phase)}
await p.locator('#measureTab').tap();assert.equal(await p.locator('#controls').isVisible(),true);
}
await p.locator('#randomExample').tap();await p.waitForFunction(()=>starLab.modelReady&&!!starLab.observed);assert.ok(!requests.some(x=>x.includes('observed-stars')));
await p.locator('#reset').tap();await p.waitForFunction(()=>starLab.modelReady);assert.equal(await p.locator('#observedPanel').isVisible(),false);
await p.locator('#lithiumChoice').tap();await p.locator('#spectrumChoice').tap();assert.equal(await p.locator('#lithiumPanel').isVisible(),true);assert.equal(await p.locator('#spectrumPanel').isVisible(),true);
await p.locator('#lithiumSlider').evaluate(e=>{e.value=200;e.dispatchEvent(new Event('input',{bubbles:true}))});assert.equal(await p.evaluate(()=>starLab.state.lithium),200);
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1));await p.screenshot({path:'validation/v26-mobile.png'});
await p.locator('#fitSummary').tap();assert.equal(await p.locator('#results').isVisible(),true);await p.screenshot({path:'validation/v26-results.png'});
await p.setViewportSize({width:1280,height:900});assert.equal(await p.locator('#measurePane').isVisible(),true);assert.equal(await p.locator('#resultPane').isVisible(),true);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:'validation/v26-desktop.png'});
assert.deepEqual(errors,[]);const report={passed:true,url:p.url(),checks:['one Random action','no retired dataset requests','numerical predictions unchanged','candidate switching','phone tabs and persistent fit','touch sliders','no page overflow','desktop side-by-side']};fs.writeFileSync('validation/v26-'+(process.env.TEST_URL?'live':'local')+'.json',JSON.stringify(report,null,2));console.log(report);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
