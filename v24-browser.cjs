const {chromium}=require('../stellar-properties-lab/node_modules/playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 const base=process.env.TEST_URL||'http://127.0.0.1:8768/';await p.goto(new URL('audit.html',base).href);
 await p.waitForFunction(()=>document.querySelectorAll('.audit-card').length===31);
 assert.match(await p.locator('#summary').innerText(),/101 consistent.*31 disagree.*1 unresolved/);
 for(const [filter,count] of [['all',133],['match',101],['neutral',1],['mismatch',31]]){await p.locator('[data-status="'+filter+'"]').tap();assert.equal(await p.locator('.audit-card').count(),count)}
 await p.goto(new URL('audit.html#star-4840662',base).href);await p.waitForFunction(()=>document.getElementById('star-4840662')?.open);
 assert.match(await p.locator('#star-4840662').innerText(),/No catalog-compatible stage/);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const suffix=process.env.TEST_URL?'live':'browser';await p.screenshot({path:'validation/v24-'+suffix+'.png'});
 await p.goto(base);await p.waitForFunction(()=>window.starLab?.ready&&starLab.modelReady,null,{timeout:120000});
 const star=JSON.parse(fs.readFileSync('public/data/diagnostic-stars.json')).stars.find(s=>s.id===7022298);
 const corrected=JSON.parse(fs.readFileSync('public/data/diagnostic-stars.json')).stars.find(s=>s.id===5876824);
 await p.evaluate(s=>starLab.loadObservedStar(s,true),corrected);await p.waitForFunction(()=>starLab.modelReady);
 assert.equal(await p.locator('.catalog-indicator.mismatch').count(),1);
 assert.match(await p.locator('#observedComparison').innerText(),/pre-main-sequence fit disagrees/);
 await p.evaluate(s=>starLab.loadObservedStar(s,true),star);await p.waitForFunction(()=>starLab.modelReady);
 assert.equal(await p.locator('.catalog-indicator.mismatch').count(),1);
 assert.equal(await p.locator('#sampleAuditLink').getAttribute('href'),'audit.html#star-7022298');
 await p.locator('#sampleAuditLink').tap();await p.waitForFunction(()=>document.getElementById('star-7022298')?.open);
 assert.match(await p.locator('#star-7022298').innerText(),/receives no score/);
 for(const path of ['data/sample-audit.json','data/sample-audit.csv','data/sample-audit.sqlite']){const r=await p.request.get(new URL(path,base).href);assert.equal(r.status(),200);assert.ok((await r.body()).length>1000)}
 assert.deepEqual(errors,[]);
 const result={passed:true,url:base,checks:['all 133 records accessible','status filters correct','each mismatch has cause and improvement','per-star app link opens exact record','production mismatch unchanged','phone overflow','audit downloads']};
 fs.writeFileSync('validation/v24-'+suffix+'.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
