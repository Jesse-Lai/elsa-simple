import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { bebopCase, bebopDataset } from '../lib/metis/bebop-case';
import { caseMetricCalculations, caseMetricDefinition, caseRawMetric, resolveCaseEvidence } from '../lib/metis/case-evidence';
import { RawMetricTable } from '../components/metis/case-evidence-dialog';

const metric = (id: string) => bebopCase.metrics.find(item => item.id === id)!;

test('metric details distinguish early and later DAU and retain the correct source scope', () => {
  assert.deepEqual(resolveCaseEvidence(bebopDataset, 'case-metric:message-dau').metrics.map(item => item.id), ['message-dau']);
  assert.deepEqual(resolveCaseEvidence(bebopDataset, 'case-metric:early-dau').metrics.map(item => item.id), ['early-dau']);
  assert.deepEqual(resolveCaseEvidence(bebopDataset, 'metric:retention').metrics.map(item => item.id), ['message-dau']);
  assert.deepEqual(resolveCaseEvidence(bebopDataset, 'case-metric:early-sat').sources.map(item => item.id), ['S08']);
  const source = resolveCaseEvidence(bebopDataset, 'source:P2');
  assert.ok(source.metrics.length > 1);
  assert.ok(source.metrics.every(item => item.sourceIds.includes('P2')));
  assert.ok(!source.metrics.some(item => item.id === 'early-dau'));
  assert.deepEqual(resolveCaseEvidence(bebopDataset, 'source:P4').metrics, []);
  assert.deepEqual(resolveCaseEvidence(bebopDataset, 'unknown'), { metrics: [], sources: [] });
});

test('raw tables preserve source ratios and reported precision while calculations use display units', () => {
  const active = metric('active-sessions');
  assert.equal(active.unit, '%');
  assert.equal(caseRawMetric(active).unit, 'ratio');
  assert.ok(Math.abs(caseRawMetric(active).control - .3071) < 1e-10);
  assert.ok(Math.abs(caseRawMetric(active).treatment - .3238) < 1e-10);
  assert.equal(caseRawMetric(metric('message-dau')).unit, '%');
  assert.equal(caseRawMetric(metric('early-dsat')).unit, 'ratio');
  assert.match(caseMetricCalculations(metric('early-sat')).absolute, /79.11% − 83.45% = -4.34 pp/);
  assert.match(caseMetricCalculations(metric('stop-generating')).relative, /\+37.69%/);
  assert.match(caseMetricCalculations({ ...active, control: 0 }).relative, /Undefined/);
  assert.match(caseMetricDefinition(metric('message-dau')).formulaLabel, /incomplete/);
  assert.match(caseMetricDefinition(metric('early-sat')).limitation, /not supplied/);
  const html = renderToStaticMarkup(createElement(RawMetricTable, { metrics: [active, metric('stop-generating'), metric('early-thumbs-down')], onMetric: () => {} }));
  for (const value of ['0.3071', '0.3238', '+38.2%', '0.0012', '0.0011', '0.5723']) assert.ok(html.includes(value), value);
  assert.doesNotMatch(html, /37.69%|30.71%|0.5739/);
});
