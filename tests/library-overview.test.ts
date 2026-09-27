import test from 'node:test';
import assert from 'node:assert/strict';
import { experimentOptions } from '../lib/metis/experiment-catalog';
import { getDataset } from '../lib/metis/datasets';
import { libraryDecision, libraryOverview, matchesLibraryFilter } from '../lib/metis/library-overview';

test('overview counts experiments once and keeps lifecycle separate from readiness', () => {
  const summary = libraryOverview(experimentOptions);
  assert.equal(summary.total, 8);
  assert.equal(summary.completed, 4);
  assert.equal(summary.running, 1);
  assert.equal(summary.unknownLifecycle, 3);
  assert.deepEqual(summary.decisions, { attention: 3, ship: 2, continue: 1, unassessed: 2 });
  assert.equal(Object.values(summary.decisions).reduce((sum, n) => sum + n, 0), summary.total);
  const bebop = experimentOptions.find(experiment => experiment.id === 'bebop-5pct')!;
  assert.ok(matchesLibraryFilter(bebop, 'attention'));
  assert.equal(matchesLibraryFilter(bebop, 'completed'), false);
});

test('a ship recommendation cannot hide uncertain or breached guardrails', () => {
  const data = structuredClone(getDataset('checkout-simplification'));
  assert.equal(libraryDecision(data).status, 'ship');
  data.metrics.find(metric => metric.id === 'latency')!.ci = [-148, 80];
  assert.equal(libraryDecision(data).status, 'continue');
  data.metrics.find(metric => metric.id === 'latency')!.treatment = 1100;
  assert.equal(libraryDecision(data).status, 'attention');
  assert.equal(libraryDecision().status, 'unassessed');
});

test('filtered and empty views have consistent counts and no fabricated status', () => {
  const conversion = experimentOptions.filter(experiment => experiment.group === 'Conversion');
  assert.deepEqual(libraryOverview(conversion).decisions, { attention: 1, ship: 1, continue: 1, unassessed: 0 });
  assert.deepEqual(libraryOverview([]), { total: 0, completed: 0, running: 0, unknownLifecycle: 0, decisions: { attention: 0, ship: 0, continue: 0, unassessed: 0 } });
});
