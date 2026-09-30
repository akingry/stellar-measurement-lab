const{chromium}=require('../stellar-properties-lab/node_modules/playwright-core');const assert=require('node:assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(process.env.TEST_URL||'http://127.0.0.1:8768/');await page.waitForFunction(()=>starLab.ready&&starLab.modelReady,null,{timeout:120000});
assert.equal(await page.locator('input:visible').count(),2);assert.equal(await page.locator('#preview').isVisible(),false);assert.equal(await page.locator('input:not([type=range]),textarea').count(),0);
assert.ok(await page.locator('#lithiumChoice').isVisible());assert.equal(await page.locator('#seismicChoice').isVisible(),false);
await page.locator('#lithiumChoice').tap();assert.equal(await page.locator('input:visible').count(),3);
const slider=page.locator('#lithiumSlider');await slider.scrollIntoViewIfNeeded();const box=await slider.boundingBox();assert.ok(box.x>=44);assert.equal(await slider.evaluate(e=>getComputedStyle(e).touchAction),'none');const cdp=await page.context().newCDPSession(page),sy=await page.evaluate(()=>scrollY),y=box.y+box.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.2,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.7,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();assert.ok(Math.abs(await page.evaluate(()=>scrollY)-sy)<2);
const set=async(id,value)=>page.evaluate(({id,value})=>{const e=document.getElementById(id+'Slider');e.value=value;e.dispatchEvent(new Event('input'))},{id,value});
await set('lithium',20);const low=await page.evaluate(()=>starLab.ranking.rows[0].phase);await set('lithium',200);const high=await page.evaluate(()=>starLab.ranking.rows[0].phase);assert.notEqual(low,high);
await page.locator('#candidateList button:not(:disabled)').first().tap();assert.ok(await page.locator('#preview').isVisible());assert.ok(await page.evaluate(()=>document.getElementById('preview').getBoundingClientRect().top<document.getElementById('hr').getBoundingClientRect().top));
await page.screenshot({path:'validation/v12-'+(process.env.TEST_URL?'live-':'')+'selected.png',fullPage:true});
await set('lithium',30);assert.equal(await page.locator('#preview').isVisible(),false);
await set('T',Math.log10(4800));await set('logL',Math.log10(50));await page.waitForFunction(()=>starLab.modelReady);assert.ok(await page.locator('#seismicChoice').isVisible());assert.equal(await page.locator('#lithiumChoice').isVisible(),false);
await page.locator('#seismicChoice').tap();assert.equal(await page.locator('input:visible').count(),5);
await page.screenshot({path:'validation/v12-'+(process.env.TEST_URL?'live-':'')+'giant.png',fullPage:true});
const scores=await page.evaluate(()=>starLab.ranking.rows.filter(r=>r.percent!==null).map(r=>r.percent));assert.ok(Math.abs(scores.reduce((a,b)=>a+b,0)-100)<1e-8);
await set('T',Math.log10(2500));await set('logL',6);await page.waitForFunction(()=>starLab.modelReady);assert.equal(await page.locator('#verdict').innerText(),'No model match');assert.equal(await page.locator('#preview').isVisible(),false);
await page.locator('#reset').tap();await page.waitForFunction(()=>starLab.modelReady);assert.equal(await page.locator('input:visible').count(),2);
for(const width of [320,390,430,1440]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))}
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'validation/v12-'+(process.env.TEST_URL?'live-':'')+'initial.png',fullPage:true});
assert.deepEqual(errors,[]);const report={passed:true,url:page.url(),checks:['two starting sliders','conditional measurement choices','lithium shifts leader','preview click gate','changing data clears preview','star above diagram after selection','giant controls','normalized shares','no-match guard','mobile overflow'],limitation:'Relative likelihood shares are not calibrated probabilities; actual iPhone app gestures not verified.'};fs.writeFileSync('validation/v12-'+(process.env.TEST_URL?'live':'browser')+'.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
