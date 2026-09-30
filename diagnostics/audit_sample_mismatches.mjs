import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {buildMesh,inferPoint} from '../public/point-inference.js';
import {buildCooling,inferCooling} from '../public/cooling.js';
import {rank,seismicShares,lithiumPrediction} from '../public/ranking.js';
import {observedMeasurements,compareReference,referenceIndicator} from '../public/observed.js';
import {phases} from '../public/engine.js';
import {spectralGravity} from '../public/spectral.js';
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sample=read('public/data/diagnostic-stars.json');
const baseline=read('validation/v22-science.json');
const spectra=read('diagnostics/mismatch-audit/spectroscopy.json');
const data={spectrum:read('public/data/spectral-index.json'),lithium:read('public/data/lithium-grid.json'),evidence:read('public/data/evidence.json'),seismic:read('public/data/seismic-density.json')};
const meshes=read('public/data/manifest.json').files.map(f=>{const b=zlib.gunzipSync(fs.readFileSync('public/data/'+f.name)),m=buildMesh(new Float32Array(b.buffer,b.byteOffset,b.byteLength/4));m.metallicity=f.initial_feh;return m});
const cooling=buildCooling(read('public/data/cooling-grid.json'));
const infer=q=>[...inferPoint(meshes,{T:q.T,logL:q.logL,allSolutions:true}).groups,...inferCooling(cooling,q)];
const label=p=>phases[p]?.name||String(p);
const summarize=r=>({conflict:r.conflict,partial:r.partial,tied:r.tied,rows:r.rows.map(x=>({phase:x.phase,name:label(x.phase),percent:x.percent,tested:x.tested,total:x.total,partial:x.partial,chosen:x.chosen?{mass:x.chosen.mass,logAge:x.chosen.age,metallicity:x.chosen.metallicity}:null}))});
// Broad catalog categories are not precise stage ground truth. Phase 2 is only a compatible envelope.
const expected=s=>s.stageReference?.phases||(s.classCode===0?[0]:s.classCode===1?[2]:s.classCode===2?[2,3,4,5]:[]);
const normalize=rows=>{const valid=rows.filter(x=>x.tested),peak=Math.max(...valid.map(x=>x.log)),sum=valid.reduce((v,x)=>v+Math.exp(x.log-peak),0);for(const x of rows)x.percent=x.tested?100*Math.exp(x.log-peak)/sum:null;rows.sort((a,b)=>(b.percent??-1)-(a.percent??-1));return{rows,partial:rows.some(x=>x.partial),conflict:false,tied:rows.filter(x=>x.percent!==null&&Math.abs(x.percent-rows[0].percent)<1e-8).length>1}};
const records=[];
for(const s of sample.stars){
 const recorded=observedMeasurements(s),q={...recorded,measurements:[...s.exampleSetup.measurements]};q.diagnostic=q.measurements.at(-1)||'none';
 const g=infer(q),r=rank(g,q,data),referencePhases=expected(s),status=referenceIndicator(s,r);
 const mutated=observedMeasurements({...s,classCode:999,catalogClass:'wrong',stageReference:{phases:[999]},spectralType:'wrong'});
 assert.deepEqual(mutated,recorded);
 const tests=[];
 const sets=[[],...recorded.measurements.map(n=>[n]),recorded.measurements];
 for(const names of [...new Map(sets.map(a=>[a.join('+'),a])).values()]){
  const test=rank(g,{...recorded,measurements:names,diagnostic:names.at(-1)||'none'},data);
  tests.push({measurements:names,...summarize(test),comparison:compareReference(s,test)});
 }
 const missing=referencePhases.filter(p=>!g.some(x=>x.phase===p)),untested=r.rows.filter(x=>referencePhases.includes(x.phase)&&!x.tested).map(x=>x.phase);
 const reasons=[],improvements=[];
 if(status.status==='mismatch'&&untested.length){
  reasons.push({code:'reference-stage-not-calibrated',certainty:'verified in code and this record',text:'The catalog-compatible stage exists at the measured position but receives no score. Lithium is calibrated only for pre-main-sequence and main-sequence stars. The percentages normalize those tested stages, not all possible stages.'});
  improvements.push({action:'Add a validated evolved-star diagnostic likelihood for the untested stage, with matched units and uncertainty. Until then, display this as an incomplete test rather than an exclusion of that stage.',status:'requires external calibration; cannot repair by renormalizing or relabeling',test:'Hold out these stars and evaluate the new diagnostic on independent subgiant and main-sequence validation data.'});
 }
 if(status.status==='mismatch'&&missing.length===referencePhases.length){
  reasons.push({code:'reference-stage-absent-at-exact-position',certainty:'verified for the current grid',text:'No catalog-compatible stage is returned at the exact stored temperature and luminosity. Diagnostic reweighting cannot select a stage missing from the candidate set.'});
  improvements.push({action:'Test an uncertainty-aware temperature/luminosity likelihood and denser evolutionary-grid coverage, retaining covariance where available; never shift the recorded values to obtain agreement.',status:'sensitivity experiment below, not a validated replacement likelihood',test:'Recover withheld model points and benchmark across all stars, not only this disagreement.'});
 }
 const expectedScored=r.rows.filter(x=>referencePhases.includes(x.phase)&&x.tested);
 if(status.status==='mismatch'&&expectedScored.length&&q.measurements.includes('lithium')){
  reasons.push({code:'overlapping-lithium-likelihoods',certainty:'verified likelihood ordering; true physical cause not established',text:'Both young and main-sequence stages are scored. The best young-star lithium likelihood is higher at the current temperature and luminosity, despite the main-sequence reference. Lithium dispersion, profile selection over age/metallicity, and unpropagated input uncertainties prevent treating this as a decisive age identification.'});
  improvements.push({action:'Fit consistent-temperature spectral data with uncertainty and parameter covariance; validate age/metallicity marginalization and independently justified population priors on held-out stars. Add an independent calibrated youth diagnostic where available.',status:'tested uncertainty and gravity variants below; no label-tuned threshold or prior adopted',test:'Count improvements and regressions on the entire fixed sample, then confirm on an independent holdout.'});
 }
 const lithiumFits=q.measurements.includes('lithium')?r.rows.filter(x=>x.chosen&&[-1,0].includes(x.phase)).map(x=>{const sol=x.chosen,p=lithiumPrediction(data.lithium,q.T,sol.age,sol.metallicity),sigma=Math.hypot(p[1],Number.isFinite(q.lithiumError)?q.lithiumError:5);return{phase:x.phase,predictedEquivalentWidth:p[0],intrinsicScatter:p[1],combinedSigma:sigma,standardizedResidual:(q.lithium-p[0])/sigma,bestLogLikelihood:x.log,logAge:sol.age,metallicity:sol.metallicity}}):[];
 const omitted=recorded.measurements.filter(n=>!q.measurements.includes(n));
 if(omitted.length){
  reasons.push({code:'recorded-diagnostic-not-enabled',certainty:'verified loader behavior',text:'The saved example enables '+(q.measurements.join(' + ')||'temperature and luminosity only')+' and leaves recorded '+omitted.join(' + ')+' out of the fit.'});
  improvements.push({action:'Evaluate all applicable recorded diagnostic sets; warn when a stored measurement cannot test the sole positional candidate. Avoid silently presenting position-only certainty.',status:'each diagnostic and joint set tested below',test:'Use measurements and calibration coverage only, never the reference label, to choose the evaluation path.'});
 }
 if(r.partial)reasons.push({code:'incomplete-model-comparison',certainty:'verified',text:'At least one compatible model solution is outside the active calibration. Agreement is conditional, not full exclusion of the alternatives.'});
 if(status.status==='neutral'){
  reasons.push({code:r.tied?'tied-leaders':'reference-model-category-mismatch',certainty:'verified',text:status.detail});
  improvements.push({action:r.tied?'Obtain a validated diagnostic that separates the tied phases.':'Compare compatible category levels explicitly; the phase-2 flag does not distinguish a subgiant from a red-giant-branch star.',status:'not a match or mismatch at the requested stage precision',test:'Keep broad classification agreement distinct from evolutionary-stage agreement.'});
 }
 let sensitivity=null;
 let uncertaintyExperiment=null;
 if(Number.isFinite(s.temperatureError)&&Number.isFinite(s.radiusErrorLower)&&Number.isFinite(s.radiusErrorUpper)){
  const trials=[];
  const profile=new Map();
  for(const dt of [-2,-1,0,1,2])for(const dr of [-2,-1,0,1,2]){
   const T=s.T+dt*s.temperatureError,R=s.radius+dr*(dr<0?s.radiusErrorLower:s.radiusErrorUpper),logL=Math.log10(R**2*(T/5772)**4);
   const gg=infer({T,logL});
   const rr=rank(gg,{...recorded,T,logL},data);
   for(const row of rr.rows){const prior=profile.get(row.phase),log=row.log-(dt*dt+dr*dr)/2;
    const best=!prior||log>prior.log?{...row,log,offset:{dt,dr}}:{...prior};
    best.total=(prior?.total||0)+row.total;best.tested=(prior?.tested||0)+row.tested;best.partial=best.tested<best.total;
    profile.set(row.phase,best);
   }
   trials.push({temperatureOffsetSigma:dt,radiusOffsetSigma:dr,T,luminosity:10**logL,phases:gg.map(x=>x.phase)});
  }
  const compatible=trials.filter(t=>t.phases.some(p=>referencePhases.includes(p)));
  sensitivity={method:'25-point temperature/radius sensitivity grid at -2,-1,0,+1,+2 quoted errors. Luminosity recomputed from radius and temperature; not independent temperature/luminosity sampling, not posterior probabilities. Temperature/radius covariance unavailable.',referenceCoveredAtCenter:g.some(x=>referencePhases.includes(x.phase)),referenceCoveredWithinOneSigma:compatible.some(t=>Math.abs(t.temperatureOffsetSigma)<=1&&Math.abs(t.radiusOffsetSigma)<=1),nearestSampledCompatibleOffset:compatible.sort((a,b)=>a.temperatureOffsetSigma**2+a.radiusOffsetSigma**2-b.temperatureOffsetSigma**2-b.radiusOffsetSigma**2)[0]||null,trials};
  const rr=normalize([...profile.values()]);
  uncertaintyExperiment={method:'Audit-only coarse profile likelihood over the same 25 positions with Gaussian offset penalties and every usable recorded diagnostic; no reference-label filtering. Not a production posterior or a validated joint covariance model.',...summarize(rr),comparison:compareReference(s,rr),status:referenceIndicator(s,rr).status};
 }
 let gravityExperiment=null;
 const sp=spectra[String(s.id)];
 if(sp&&Number.isFinite(sp.logGravity)&&sp.logGravityError>0){
  const rows=g.map(group=>{let log=-Infinity,chosen=null;for(const sol of group.solutions){const value=-.5*((spectralGravity(q.T,q.logL,sol.mass)-sp.logGravity)/sp.logGravityError)**2;if(value>log){log=value;chosen=sol}}return{...group,log,chosen,tested:group.solutions.length,total:group.solutions.length,partial:false}});
  const rr=normalize(rows);
  gravityExperiment={method:'Audit-only spectrum-derived surface-gravity likelihood at the original temperature/luminosity, replacing rather than extending lithium. Uses quoted gravity error; ignores parameter covariance/systematics. Not yet a direct measured-line slider calibration.',observed:sp,...summarize(rr),comparison:compareReference(s,rr),status:referenceIndicator(s,rr).status};
 }
 const seismic=recorded.measurements.includes('seismic')?seismicShares(recorded,data):null;
 if(!reasons.length)reasons.push({code:'consistent-with-reference',certainty:'comparison only',text:'The leading model is consistent with the available reference category. Shared evidence and limited model coverage prevent treating this as independent confirmation.'});
 records.push({id:s.id,name:s.displayName||'Kepler Input Catalog '+s.id,reference:s.catalogClass,referenceStage:s.stageReference?.label||null,spectralType:s.spectralType,referencePhases,enabled:q.measurements,available:recorded.measurements,status:status.status,comparison:status.detail,previousComparison:baseline.predictions.find(p=>p.id===s.id).comparison,prediction:summarize(r),measurements:{temperature:s.T,luminosity:s.luminosity,lithium:s.lithium,lithiumError:s.lithiumError,magnesium:s.wing,frequencySpacing:s.Dnu,peakFrequency:s.numax,periodSpacing:s.DPi1,periodSpacingError:s.periodSpacingError},missingReferencePhases:missing,unscoredReferencePhases:untested,reasons,improvements,diagnosticAblations:tests,lithiumLikelihoodDetails:lithiumFits,seismicOnlyClassShares:seismic,sensitivity,uncertaintyExperiment,gravityExperiment,referenceProvenance:s.stageReference||s.provenance||{source:'Berger2018',url:'https://cdsarc.cds.unistra.fr/ftp/J/ApJ/866/99/'}});
}
const counts=Object.fromEntries(['match','mismatch','neutral'].map(k=>[k,records.filter(r=>r.status===k).length]));
const out={version:24,generatedAt:new Date().toISOString(),scope:'All 133 diagnostic examples; not the separate 15,000-star population sample.',counts,partialComparisons:records.filter(r=>r.prediction.partial).length,changedPredictions:0,
 caveats:['Match means consistency at the available reference level, not confirmed classification or independent accuracy.','Reference labels are used only after prediction; records and recorded values are unchanged.','No magnesium observations occur in this sample, so magnesium cannot be validated here.','Uncertainty sweeps are sensitivity tests, not replacements for recorded data or posterior fitting.','The sample is diagnostic/coverage-selected and not an unbiased accuracy benchmark.'],
 hashes:Object.fromEntries(['public/data/diagnostic-stars.json','public/data/observed-stars.json','public/ranking.js','public/point-inference.js'].map(p=>[p,hash(p)])),records};
fs.mkdirSync('diagnostics/mismatch-audit',{recursive:true});
fs.writeFileSync('public/data/sample-audit.json',JSON.stringify(out,null,2));
console.log(JSON.stringify({counts,partial:out.partialComparisons,disagreements:records.filter(r=>r.status==='mismatch').map(r=>({id:r.id,causes:r.reasons.map(x=>x.code),seismic:r.seismicOnlyClassShares,uncertainty:r.sensitivity&&{center:r.sensitivity.referenceCoveredAtCenter,oneSigma:r.sensitivity.referenceCoveredWithinOneSigma,nearest:r.sensitivity.nearestSampledCompatibleOffset}}))},null,2));
