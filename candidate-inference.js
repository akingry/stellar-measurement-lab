import{inferPoint}from './point-inference.js';
import{inferCooling}from './cooling.js';
import{inferObserved}from './observed-inference.js?v=25';
export function inferForQuery(meshes,cooling,q){
 const central=inferPoint(meshes,q);central.groups.push(...inferCooling(cooling,q));
 const observed=q.observationErrors?inferObserved(meshes,q):null;
 // Distinct cooling grids lack a common formation-age measure. Keep their
 // established exact-position calculation, with the fallback shown explicitly.
 const result=observed?.count&&!central.groups.some(g=>g.phase===10)?observed:central;
 result.scaleGroups=central.groups;result.uncertaintyFallback=Boolean(q.observationErrors&&result===central);
 return result;
}
