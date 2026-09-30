// Reference labels never enter the measurement state or the inference worker.
import {observationErrors} from './observed-inference.js?v=25';
export function observedMeasurements(star){
 const q={T:star.T,logL:Math.log10(star.luminosity),lithium:star.lithium,
  lithiumError:star.lithiumError,wing:star.wing,Dnu:star.Dnu,numax:star.numax,
  DPi1:star.DPi1,spacingError:star.periodSpacingError,observationErrors:observationErrors(star),observedMode:true,measurements:[]};
 if(Number.isFinite(star.lithium)&&!star.lithiumLimit)q.measurements.push('lithium');
 if(Number.isFinite(star.wing))q.measurements.push('spectrum');
 if([star.Dnu,star.numax,star.DPi1].every(x=>Number.isFinite(x)&&x>0)&&star.oscillationAlias===0)q.measurements.push('seismic');
 q.diagnostic=q.measurements.at(-1)||'none';
 return q;
}
export function randomIndex(count){
 // Rejection sampling avoids modulo bias, never filters by classification or fit.
 const cap=Math.floor(2**32/count)*count,a=new Uint32Array(1);
 do{crypto.getRandomValues(a)}while(a[0]>=cap);
 return a[0]%count;
}
export function compareReference(star,ranking){
 if(!ranking||!ranking.rows.length)return 'Not testable: no model coverage at the recorded position.';
 if(ranking.conflict)return 'Disagreement: measurements conflict with calibrated models.';
 const valid=ranking.rows.filter(r=>r.percent!==null);
 if(!valid.length)return 'Not testable: recorded measurements lack applicable calibration.';
 const best=valid[0].percent,leaders=valid.filter(r=>Math.abs(r.percent-best)<1e-8);
 if(leaders.length>1)return 'Unresolved: tied leading fits; no match forced.';
 const qualify=text=>ranking.partial?'Provisional: '+text+' Untested solutions remain.':text;
 const phase=leaders[0].phase;
 if(star.stageReference)return qualify(star.stageReference.phases.includes(phase)?'Leading fit is consistent with the reference stage group; reference evidence may overlap.':'Leading fit disagrees with the reference stage group.');
 if(phase===2)return 'Not directly comparable: the model combines subgiants and red-giant-branch stars.';
 if(phase===-1&&[0,1,2].includes(star.classCode))return qualify('Leading pre-main-sequence fit disagrees with the broad catalog classification.');
 const broad=phase===0?0:[3,4,5].includes(phase)?2:null;
 if(broad===null)return 'Not directly comparable: different catalog and model categories.';
 return qualify(broad===star.classCode?'Consistent at broad-class level; not an independent stage confirmation.':'Disagrees with the broad catalog classification.');
}

// Presentation only: reuse the reference comparison, never feed labels into ranking.
export function referenceIndicator(star,ranking,edited=false){
 if(!star)return null;
 const detail=edited?'Exploration: measurements changed; no longer the recorded-star test.':compareReference(star,ranking);
 const status=edited?'neutral':/disagree|conflict/i.test(detail)?'mismatch':/consistent/i.test(detail)?'match':'neutral';
 const broad=/broad-class/i.test(detail),partial=/^Provisional/.test(detail);
 return {status,symbol:status==='match'?'✓':status==='mismatch'?'✕':'—',
  label:edited?'Measurements changed':status==='match'?(broad?'Broad class matches':partial?'Provisional stage match':'Stage group matches'):status==='mismatch'?'Catalog mismatch':/^Unresolved/.test(detail)?'Tied predictions':'Not comparable',detail};
}
