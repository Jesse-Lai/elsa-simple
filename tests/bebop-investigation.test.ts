import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { bebopCase, bebopDataset } from '../lib/metis/bebop-case';
import { bebopContext, investigationMetric } from '../lib/metis/bebop-investigation';
import { caseDelta, caseRelative, caseSignal } from '../lib/metis/case-study';
import { caseDeltaPoints } from '../lib/metis/case-chart-data';
import { initialWorkspace } from '../lib/metis/data';
import { seedWorkspace } from '../lib/metis/datasets';
import { ExperimentDataProvider } from '../components/metis/experiment-data';
import { CaseStudyReport } from '../components/metis/case-study-report';

test('the report opens on the complete Findings homepage while Analysis path remains a separate view', () => {
  const branch = seedWorkspace(initialWorkspace()).branches.find(item => item.experimentId === bebopCase.id)!;
  const noop = () => {};
  const html = renderToStaticMarkup(createElement(ExperimentDataProvider, { value: bebopDataset }, createElement(CaseStudyReport, {
    branch, artifact: branch.artifacts[0], onEvidence: noop, onAsk: noop, onBranch: noop, onAction: noop,
  })));
  assert.match(html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, ''), /<button[^>]*role="tab"[^>]*aria-selected="true"[^>]*>Findings<\/button>/);
  assert.match(html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, ''), /<button[^>]*role="tab"[^>]*aria-selected="false"[^>]*>Analysis path<\/button>/);
  for (const text of ['Stage 01:', 'Stage 02:', 'Stage 03:', 'Thumbs-down rate', '2-day engagement', 'Observed Web and Work query shares', 'Test queued prompt', 'Removing Web/Work switching creates task mismatch']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, />Hypotheses &amp; plans<|>Data &amp; sources</);
});

test('investigation charts normalize ratios without changing source measurements or their windows', () => {
  const sat = bebopCase.metrics.find(metric => metric.id === 'early-sat')!;
  const presented = investigationMetric(sat);
  assert.deepEqual([sat.control, sat.treatment, sat.unit], [0.8345, 0.7911, 'ratio']);
  assert.equal(presented.unit, '%');
  assert.ok(Math.abs(presented.control - 83.45) < 1e-10);
  assert.ok(Math.abs(presented.treatment - 79.11) < 1e-10);
  assert.equal(caseDelta(presented), '-4.34 pp');
  assert.equal(presented.window, sat.window);
  assert.deepEqual(presented.sourceIds, sat.sourceIds);
  assert.equal(caseRelative(presented), caseRelative(sat));
  const rows = ['message-dau', 'early-sat', 'zq-engagement', 'stop-generating', 'non-zq-cancel'].map(id => investigationMetric(bebopCase.metrics.find(metric => metric.id === id)!));
  assert.equal(caseDeltaPoints(rows).length, 5);
  assert.equal(new Set(rows.map(metric => metric.window)).size, 3);
});

test('explicit thumbs-down stays inconclusive and distinct from inferred DSAT and thumbs-up', () => {
  const raw = bebopCase.metrics.find(metric => metric.id === 'early-thumbs-down')!;
  const presented = investigationMetric(raw);
  assert.deepEqual([raw.control, raw.treatment], [.0012, .0011]);
  assert.equal(caseDelta(presented), '-0.01 pp');
  assert.equal(caseRelative(presented), '-8.33%');
  assert.equal(raw.reportedRelative, -10.17);
  assert.equal(raw.pValue, '0.5723');
  assert.equal(caseSignal(raw).tone, 'neutral');
  assert.equal(caseSignal(presented).label, 'Inconclusive');
});

test('qualitative return data and contextual toggle usage do not become invented A/B metrics', () => {
  assert.equal(bebopContext.twoDayEngagement.control, null);
  assert.equal(bebopContext.twoDayEngagement.treatment, null);
  assert.equal(bebopContext.toggleUsage.denominator, 'sessions');
  assert.equal(bebopContext.toggleUsage.approximate, true);
  assert.match(bebopContext.toggleUsage.note, /not a click-through rate or an A\/B effect/);
  assert.deepEqual(bebopContext.queryMix.rows.map(row => [row.control, row.treatment]), [[55.68, 58.11], [44.07, 41.88]]);
  assert.ok(Math.abs(bebopContext.queryMix.rows[0].treatment - bebopContext.queryMix.rows[0].control - 2.43) < 1e-10);
  assert.equal(bebopCase.plans.find(plan => plan.id === 'web-work')?.origin, 'ELSA validation plan');
  const sources = new Set(bebopCase.sources.map(source => source.id));
  for (const observation of Object.values(bebopContext)) assert.ok(observation.sourceIds.every(id => sources.has(id)));
});
