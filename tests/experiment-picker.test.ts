import test from 'node:test';
import assert from 'node:assert/strict';
import { scorecardsForGroup, selectedExperiment, selectedScorecard } from '../lib/metis/experiment-catalog';
import { datasetForUrl } from '../lib/metis/datasets';

test('experiment IDs resolve to the same selection as existing URLs',()=>{
  const byId=selectedExperiment('  CHECKOUT-SIMPLIFICATION  ');
  assert.equal(byId?.name,'Checkout simplification');
  assert.equal(selectedExperiment('https://experiments.example.com/checkout-simplification/?from=picker'),byId);
  assert.equal(selectedExperiment('unknown-id'),undefined);
  assert.equal(selectedExperiment('constructor'),undefined);
});

test('scorecard selection is scoped to its group and resolves the analysis snapshot',()=>{
  const growth=scorecardsForGroup('Growth & activation');
  assert.equal(growth.length,2);
  const conversion=scorecardsForGroup('Conversion');
  assert.equal(conversion.length,3);
  for(const card of [...growth,...conversion]){
    assert.equal(selectedScorecard(card.id,card.group),card);
    assert.equal(selectedScorecard(card.experimentId,card.group),card);
    assert.equal(selectedScorecard(card.url,card.group),card);
    assert.equal(datasetForUrl(card.url)?.experiment.snapshotId,card.id);
  }
  assert.equal(selectedScorecard(growth[0].id,'Conversion'),undefined);
  assert.equal(selectedScorecard('unknown-id','Growth & activation'),undefined);
  assert.deepEqual(scorecardsForGroup('New group'),[]);
  assert.deepEqual(scorecardsForGroup('New group',[growth[0].url,growth[0].url]),[growth[0]]);
  assert.equal(scorecardsForGroup('Growth & activation',[growth[0].url]).length,2);
});
