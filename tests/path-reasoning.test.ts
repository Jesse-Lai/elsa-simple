import test from 'node:test';
import assert from 'node:assert/strict';
import { downstreamPathNodes, validatePathResult, currentPathUpdates, pathNodes, type PathUpdate, type PathRevision } from '../lib/metis/path-reasoning';

const update=(nodeId:string):PathUpdate=>({nodeId,conclusion:`Reassess ${nodeId}`,reasoning:'The comment suggests a new hypothesis, not a measured outcome.',state:'needs-data',evidenceIds:[]});
const result=(id:string)=>({summary:'Reassessment',updates:downstreamPathNodes(id).map(update)});

test('directed propagation crosses rounds without rewriting parents or parallel hypotheses',()=>{
  const ids=downstreamPathNodes('f23');
  for(const id of ['f23','o31','h31','h32','h33','h34','a31','a32','a33'])assert.ok(ids.includes(id),id);
  for(const id of ['f21','f22','h21','o21','a14','sat','dau'])assert.ok(!ids.includes(id),id);
  assert.deepEqual(downstreamPathNodes('a12'),['a12']);
  assert.deepEqual(downstreamPathNodes('constructor'),[]);
  for(const node of pathNodes)assert.doesNotThrow(()=>validatePathResult(node.id,result(node.id),[]));
});

test('partial, unrelated, duplicate and unsupported updates are rejected as a whole',()=>{
  const valid=result('f23');
  assert.throws(()=>validatePathResult('f23',{...valid,updates:valid.updates.slice(1)},[]));
  assert.throws(()=>validatePathResult('f23',{...valid,updates:[...valid.updates,update('f22')]},[]));
  assert.throws(()=>validatePathResult('f23',{...valid,updates:[...valid.updates,update('f23')]},[]));
  assert.throws(()=>validatePathResult('a12',{summary:'x',updates:[{...update('a12'),state:'supported'}]},[]));
  assert.throws(()=>validatePathResult('a12',{summary:'x',updates:[{...update('a12'),evidenceIds:['invented']}]},[]));
  assert.doesNotThrow(()=>validatePathResult('a12',{summary:'x',updates:[{...update('a12'),state:'supported',evidenceIds:['source:P1']}]},['source:P1']));
});

test('revisions preserve source nodes and surviving independent results after persistence',()=>{
  const originals=JSON.stringify(pathNodes);
  const revisions:PathRevision[]=[{...result('f23'),id:'r1',nodeId:'f23',comment:'first',createdAt:'2026-09-23'},
    {...result('a12'),id:'r2',nodeId:'a12',comment:'second',createdAt:'2026-09-23'},
    {summary:'Follow-up',updates:[{...update('a32'),conclusion:'Later conclusion'}],id:'r3',nodeId:'a32',comment:'third',createdAt:'2026-09-23'}];
  const restored=currentPathUpdates(JSON.parse(JSON.stringify(revisions)));
  assert.equal(restored.a32.conclusion,'Later conclusion');
  assert.equal(restored.a12.conclusion,'Reassess a12');
  assert.equal(restored.f23.conclusion,'Reassess f23');
  assert.equal(restored.f22,undefined);
  assert.equal(JSON.stringify(pathNodes),originals);
});
