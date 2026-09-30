const {chromium}=require('../stellar-properties-lab/node_modules/playwright-core');const assert=require('node:assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(process.env.TEST_URL||'http://127.0.0.1:8768/?v=10');await page.waitForFunction(()=>window.starLab?.ready);
assert.equal(await page.locator('input:not([type=range]),textarea,[contenteditable=true]').count(),0);
assert.equal(await page.locator('input:visible').count(),2);assert.equal(await page.locator('#verdict').innerText(),'Stage not determined');
await page.getByRole('button',{name:'Brightness oscillations',exact:true}).tap();assert.equal(await page.locator('input:visible').count(),6);
const set=async(values)=>page.evaluate(values=>{for(const [id,v]of Object.entries(values)){const el=document.getElementById(id+'Slider');el.value=v;el.dispatchEvent(new Event('input'))}},values);
const examples=await page.evaluate(()=>starLab.calibration.seismic.examples);
for(const e of examples){await set({Dnu:e.Dnu,numax:e.numax,DPi1:e.DPi1,spacingError:0});assert.equal((await page.evaluate(()=>starLab.result)).seismic.code,e.label)}
await page.getByRole('button',{name:'Technetium spectrum',exact:true}).tap();assert.equal(await page.locator('input:visible').count(),8);
const tc=await page.evaluate(()=>starLab.calibration.technetium.groups);
for(const [label,g]of Object.entries(tc)){await set({tc4238:g.example[0],tc4262:g.example[1]});assert.equal((await page.evaluate(()=>starLab.result)).technetium.rich,label==='technetium-rich')}
for(const id of ['T','logL','Dnu','numax','DPi1','spacingError','tc4238','tc4262']){
const slider=page.locator('#'+id+'Slider');await slider.scrollIntoViewIfNeeded();const b=await slider.boundingBox();assert.ok(b.x>=44);assert.ok(b.height>=44);assert.equal(await slider.evaluate(e=>getComputedStyle(e).touchAction),'none');
const before=await page.evaluate(()=>({state:starLab.state,y:scrollY})),cdp=await page.context().newCDPSession(page),y=b.y+b.height/2;
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.2,y}]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width*(.2+i*.1),y:y+1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
const after=await page.evaluate(()=>starLab.state);assert.notEqual(after[id],before.state[id]);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before.y)<2);for(const k of Object.keys(before.state).filter(k=>k!==id))assert.equal(after[k],before.state[k]);await cdp.detach();
}
await set({T:Math.log10(4800),logL:Math.log10(50),Dnu:4.45,numax:46.5,DPi1:251.2,spacingError:3,tc4238:4238.38,tc4262:4262.11});
assert.ok(await page.evaluate(()=>Math.abs(starLab.physical.radius/(Math.sqrt(10**starLab.state.logL*3.828e26/(4*Math.PI*5.670374419e-8*starLab.state.T**4))/6.957e8)-1)<1e-12));
for(const width of [320,390,430,1440]){await page.setViewportSize({width,height:width===1440?1000:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'validation/v10-'+(process.env.TEST_URL?'live-':'')+width+'.png',fullPage:true})}
await page.getByRole('button',{name:'Reset',exact:true}).tap();assert.equal(await page.locator('input:visible').count(),2);assert.equal(await page.locator('#verdict').innerText(),'Stage not determined');
await page.getByRole('button',{name:'Increase Temperature',exact:true}).tap();assert.ok(await page.evaluate(()=>starLab.state.T)>5772);
await page.goto(new URL('details.html?v=10',page.url()).href);assert.ok((await page.locator('body').innerText()).includes('not a joint fit'));assert.deepEqual(errors,[]);
const report={passed:true,url:process.env.TEST_URL||'local',checks:['No typing','Optional measured-light controls','Both seismic catalog groups respond','Both technetium patterns respond','Independent controls','Touch capture','Radius identity','No horizontal overflow','Reset clears optional evidence'],limitation:'Physical iPhone gestures unverified; scientific output is diagnostic evidence, not a joint stellar fit'};
fs.writeFileSync('validation/v10-'+(process.env.TEST_URL?'live':'browser')+'.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
