const {chromium}=require('../stellar-properties-lab/node_modules/playwright-core');const assert=require('node:assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(process.env.TEST_URL||'http://127.0.0.1:8767/?v=9');await page.waitForFunction(()=>window.starLab?.ready);
assert.equal(await page.locator('input').count(),3);assert.equal(await page.locator('input:not([type=range]),textarea,[contenteditable=true]').count(),0);assert.equal(await page.locator('#verdict').count(),1);
for(const id of ['T','logL','wing']){const slider=page.locator('#'+id+'Slider');await slider.scrollIntoViewIfNeeded();const box=await slider.boundingBox();assert.ok(box.x>=44);assert.ok(box.height>=44);assert.equal(await slider.evaluate(e=>getComputedStyle(e).touchAction),'none');
const before=await page.evaluate(()=>({state:starLab.state,y:scrollY})),cdp=await page.context().newCDPSession(page),y=box.y+box.height/2;
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.25,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*(.25+i*.06),y:y+1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before.y)<2);assert.notEqual((await page.evaluate(()=>starLab.state))[id],before.state[id]);
for(const other of ['T','logL','wing'].filter(k=>k!==id))assert.equal((await page.evaluate(()=>starLab.state))[other],before.state[other]);
assert.equal(await page.locator('#verdict').innerText(),'Stage unresolved');assert.equal(await page.evaluate(()=>starLab.result),null);
await page.evaluate(()=>{for(const id of ['T','logL','wing']){const actual=id==='T'?Math.log10(starLab.state.T):starLab.state[id];const slider=document.getElementById(id+'Slider');if(Math.abs(+slider.value-actual)>Number(slider.step)*1.01)throw Error('Control differs from requested light quantity')}});}
await page.evaluate(()=>{
 for(const id of ['T','logL','wing']){
 const el=document.getElementById(id+'Slider');
 for(const f of [0,.25,.5,.75,1]){
 const before=starLab.state;el.value=+el.min+f*(el.max-el.min);el.dispatchEvent(new Event('input'));
 const after=starLab.state;
 for(const other of ['T','logL','wing'].filter(k=>k!==id))if(after[other]!==before[other])throw Error('Coupled inputs');
 if(starLab.result!==null||document.getElementById('verdict').textContent!=='Stage unresolved')throw Error('Forced classification');
 const expected=Math.sqrt(10**after.logL*3.828e26/(4*Math.PI*5.670374419e-8*after.T**4))/6.957e8;
 if(Math.abs(starLab.physical.radius/expected-1)>1e-12)throw Error('Radius inconsistency');
 }
 }
});
await page.getByRole('button',{name:'Reset',exact:true}).tap();
const before=await page.evaluate(()=>starLab.state.T);await page.getByRole('button',{name:'Increase Temperature',exact:true}).tap();assert.ok(await page.evaluate(()=>starLab.state.T)>before);
for(const width of [320,390,430,1440]){await page.setViewportSize({width,height:width===1440?1000:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'validation/v9-'+(process.env.TEST_URL?'live-':'')+width+'.png',fullPage:true})}
assert.equal(await page.locator('#mass').count(),0);assert.deepEqual(errors,[]);const report={passed:true,url:page.url(),checks:['Exactly three sliders; no typing','One stage output','Independent light controls; no forced model or stage','Touch capture and inset on all sliders','Tap increment','No overflow at 320, 390, 430 and 1440 pixels'],modelCount:await page.evaluate(()=>starLab.modelCount),limitation:'Chromium touch emulation; physical iPhone and Telegram webview unverified'};fs.writeFileSync('validation/v9-'+(process.env.TEST_URL?'live':'browser')+'.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
