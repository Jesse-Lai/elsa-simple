import type { CaseMetric } from './case-study-types';
import type { ExperimentDataset } from './types';
import { caseDelta, caseRelative, caseValue } from './case-study';
import { investigationMetric } from './bebop-investigation';

// These scorecard rows are displayed as ratios in the supplied screenshots.
// The report stores their percentage equivalents for charting.
export function caseRawMetric(metric: CaseMetric): CaseMetric {
  return ['active-sessions', 'query-submit', 'prompting', 'early-dau', 'early-dsat'].includes(metric.id)
    ? { ...metric, control: metric.control / 100, treatment: metric.treatment / 100, unit: 'ratio' }
    : metric;
}

export function resolveCaseEvidence(dataset: ExperimentDataset, evidenceId: string) {
  const data = dataset.caseStudy;
  if (!data) return { metrics: [], sources: [] };
  const direct = evidenceId.startsWith('case-metric:')
    ? data.metrics.find(metric => metric.id === evidenceId.slice('case-metric:'.length))
    : undefined;
  const legacy = evidenceId.startsWith('metric:') ? dataset.metrics.find(metric => `metric:${metric.id}` === evidenceId) : undefined;
  const selected = direct ?? (legacy ? data.metrics.find(metric => metric.name === legacy.name && metric.window === legacy.window) : undefined);
  const sourceIds = selected?.sourceIds ?? dataset.evidenceById[evidenceId]?.sourceIds ?? [];
  return {
    metrics: selected ? [selected] : data.metrics.filter(metric => metric.sourceIds.some(id => sourceIds.includes(id))),
    sources: data.sources.filter(source => sourceIds.includes(source.id)),
  };
}

export function caseMetricDefinition(metric: CaseMetric) {
  const definitions: Record<string, { basis: string; formula: string }> = {
    'active-sessions': { basis: 'Session-level activity', formula: 'Active sessions ÷ all sessions × 100' },
    'sessions-per-user': { basis: 'Sessions per unique user', formula: 'Session count ÷ unique-user count' },
    'early-dsat': { basis: 'Turns labeled DSAT by signal', formula: 'DSAT-labeled turns ÷ all turns × 100' },
    'uplt': { basis: '95th percentile of latency, in seconds', formula: 'P95(latency observations)' },
  };
  const basis: Record<string, string> = {
    'message-dau': 'Message-active usage, reported as a percentage',
    'early-dau': 'Message DAU · scorecard aggregation: by user',
    'early-sat': 'Inferred SAT by signal · scorecard aggregation: by user',
    'zq-engagement': 'ZQ engagement, reported as a percentage in the PPT',
    'stop-generating': 'Stop generation, reported as a percentage in the PPT',
    'non-zq-cancel': 'User cancellation within the Non-ZQ slice · Bebop False / True cohorts',
    'zq-cancel': 'User cancellation within the ZQ slice · Bebop False / True cohorts',
    'early-thumbs-down': 'ThumbsDownClicked event rate · scorecard aggregation: by user',
    'early-thumbs': 'Thumbs Up Rate · scorecard aggregation: by user',
    'query-submit': 'Sessions with QuerySubmit · scorecard aggregation: by user',
    'prompting': 'Prompting Rate · scorecard aggregation: by user',
  };
  const documented = definitions[metric.id];
  return {
    basis: documented?.basis ?? basis[metric.id] ?? metric.name,
    formula: documented?.formula ?? (metric.unit === 'ratio' ? 'Displayed percentage = source ratio × 100' : 'Rate (%) = numerator ÷ denominator × 100'),
    formulaLabel: documented ? 'Metric formula' : metric.unit === 'ratio' ? 'Display conversion' : 'Rate formula · definition incomplete',
    limitation: 'Exact event filters, eligible population rules and per-metric numerator / denominator counts were not supplied.',
  };
}

export function caseMetricCalculations(raw: CaseMetric) {
  const metric = investigationMetric(raw);
  const control = caseValue(metric, metric.control), treatment = caseValue(metric, metric.treatment);
  return {
    absolute: `${treatment} − ${control} = ${caseDelta(metric)}`,
    relative: metric.control === 0 ? 'Undefined: the Control value is zero.' : `(${treatment} − ${control}) ÷ ${control} × 100 = ${caseRelative(metric)}`,
  };
}
