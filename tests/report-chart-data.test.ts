import test from 'node:test';
import assert from 'node:assert/strict';
import { datasets, getDataset } from '../lib/metis/datasets';
import { caseComparison, comparisonBarDomain, comparisonDeltaDomain, comparisonDelta, comparisonInterval, comparisonRelative, experimentComparison, reportChartGroups, reportOverviewMetrics } from '../lib/metis/report-chart-data';

test('every experiment uses its own measurements, directions and supplied intervals', () => {
  for (const data of datasets.filter(data => !data.caseStudy)) {
    const before = structuredClone(data.metrics);
    for (const metric of data.metrics) {
      const visual = experimentComparison(metric);
      assert.equal(visual.control, metric.control);
      assert.equal(visual.treatment, metric.treatment);
      assert.deepEqual(visual.ci, metric.ci);
      const [low, high] = comparisonDeltaDomain([visual]);
      assert.ok(low <= metric.treatment - metric.control && high >= metric.treatment - metric.control);
      if (metric.ci) assert.ok(low <= metric.ci[0] && high >= metric.ci[1]);
      const bars = comparisonBarDomain(visual);
      assert.equal(bars[0], 0);
      assert.ok(bars[1] >= Math.max(metric.control, metric.treatment));
    }
    assert.deepEqual(data.metrics, before);
  }
  assert.equal(experimentComparison(getDataset('checkout-simplification').metricById.latency).tone, 'positive');
  assert.equal(experimentComparison(getDataset('payment-methods').metricById.crashes).tone, 'negative');
});

test('mixed units have separate change axes and small charge risks retain precision', () => {
  const data = getDataset('payment-methods');
  const groups = reportChartGroups(data.metrics);
  assert.deepEqual(groups.map(group => group.unit), ['%', 'ms', '/user']);
  assert.equal(groups.flatMap(group => group.rows).length, data.metrics.length);
  assert.throws(() => comparisonDeltaDomain(data.metrics.map(experimentComparison)), /matching metric units/);
  const charge = experimentComparison(data.metricById.crashes);
  assert.equal(comparisonDelta(charge), '+0.02 pp');
  assert.equal(comparisonInterval(charge), '-0.008 to +0.048 pp');
  assert.ok(comparisonDeltaDomain([charge])[1] < .1);
});

test('overview respects configured roles and excludes hidden metrics without mutating history', () => {
  const data = getDataset('pricing-page-refresh');
  const config = structuredClone(data.defaultConfig);
  assert.deepEqual(reportOverviewMetrics(data.metrics, config).map(metric => metric.id), ['activation', 'latency', 'crashes', 'sessions']);
  config.roles.activation = 'excluded';
  config.roles.latency = 'target';
  config.roles.retention = 'excluded';
  assert.deepEqual(reportOverviewMetrics(data.metrics, config).map(metric => metric.id), ['latency', 'crashes', 'sessions']);
  assert.equal(data.defaultConfig.roles.activation, 'target');
});

test('missing intervals and zero baselines are explicit; Bebop gains no invented intervals', () => {
  const base = experimentComparison(getDataset('payment-methods').metricById.crashes);
  const zero = { ...base, control: 0, treatment: 0, ci: null };
  assert.equal(comparisonRelative(zero), 'Undefined');
  assert.equal(comparisonInterval(zero), 'Not supplied');
  assert.deepEqual(comparisonDeltaDomain([zero]), [-1, 1]);
  assert.ok(comparisonBarDomain(zero)[1] > 0);
  for (const metric of datasets.find(data => data.caseStudy)!.caseStudy!.metrics) {
    assert.equal(caseComparison(metric).ci, null);
    assert.equal(caseComparison(metric).context, metric.window);
  }
});
