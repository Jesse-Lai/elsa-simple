import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { analysisRounds, experimentPlans, pathEdges } from '../lib/metis/bebop-analysis-path';
import { analysisPathLayout, relatedPathNodes } from '../lib/metis/analysis-path-layout';

test('tracing an independent test includes its ancestors and continuation, without sibling tests',()=>{
  const related=relatedPathNodes('f21');
  for(const id of ['sat','h14','a14','o21','h21','f21','o31','h32','a32','h33','a31','h34','a33'])assert.ok(related.has(id),id);
  for(const id of ['f22','f23','dau','zq','o22','h22'])assert.ok(!related.has(id),id);
  assert.equal(relatedPathNodes(null).size,0);
});

test('unresolved observations do not invent experiments, and all original plans have their screenshots',()=>{
  assert.equal(analysisRounds.length,3);
  assert.equal(pathEdges.filter(([from])=>from==='h22'||from==='h31').length,0);
  assert.deepEqual(pathEdges.filter(([from])=>['h32','h33','h34'].includes(from)),[['h32','a32'],['h33','a31'],['h34','a33']]);
  assert.deepEqual(Object.keys(experimentPlans).sort(),['a31','a32','a33']);
  for(const plan of Object.values(experimentPlans)){
    assert.equal(plan.actions.length,4);
    for(const demo of plan.demos)assert.ok(existsSync(`public/cases/bebop/experiments/${demo.file}`));
  }
});

test('node growth preserves non-overlap, experiment alignment and cross-round connections',()=>{
  const heights=Object.fromEntries(analysisRounds.flatMap(round=>round.nodes.map((node,index)=>[node.id,index%3===0?280:70])));
  for(const width of [640,850,1200]){
    const layout=analysisPathLayout(width,heights);
    for(const round of analysisRounds){
      const position=layout.rounds[round.id];
      for(const column of ['observation','hypothesis','action']){
        const boxes=round.nodes.filter(node=>node.column===column).map(node=>layout.boxes[node.id]).sort((a,b)=>a.y-b.y);
        for(let i=0;i<boxes.length;i++){
          const box=boxes[i];
          assert.ok(box.x>=0&&box.x+box.width<=width);
          assert.ok(box.y>=position.diagramTop&&box.y+box.height<=position.top+position.height);
          if(i>0)assert.ok(box.y>=boxes[i-1].y+boxes[i-1].height+20);
        }
      }
      for(const [left,right] of round.alignments??[]){
        assert.equal(layout.boxes[left].y,layout.boxes[right].y);
        assert.equal(layout.boxes[left].height,layout.boxes[right].height);
      }
    }
    for(const route of layout.routes){
      assert.doesNotMatch(route.d,/NaN|Infinity/);
      assert.ok(route.from.every(id=>layout.boxes[id])&&layout.boxes[route.to]);
    }
    const ports=layout.routes.filter(route=>route.to==='o31'&&route.dots?.length);
    assert.deepEqual(ports.map(route=>route.from),[['f21'],['f22'],['f23']]);
  }
});
