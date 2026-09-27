import { caseSignal } from './case-study';
import { changeValues, number, signed } from './metric-analysis';
import type { CaseMetric } from './case-study-types';
import type { AnalysisConfig, Metric } from './types';

export type ComparisonMetric = {
  id: string;
  name: string;
  label?: string;
  control: number;
  treatment: number;
  unit: Metric['unit'] | CaseMetric['unit'];
  tone: 'positive' | 'negative' | 'neutral';
  ci: [number, number] | null;
  context: string;
};

export function experimentComparison(metric: Metric): ComparisonMetric {
  const benefit = (metric.treatment - metric.control) * (metric.direction === 'up' ? 1 : -1);
  return { ...metric, tone: benefit === 0 ? 'neutral' : benefit > 0 ? 'positive' : 'negative', context: metric.description };
}

export function caseComparison(metric: CaseMetric): ComparisonMetric {
  const labels: Record<string, string> = { 'query-submit': 'Query submission', 'new-conversations': 'New conversations' };
  return { ...metric, label: labels[metric.id], tone: caseSignal(metric).tone, ci: null, context: metric.window };
}

export const comparisonUnit = (metric: ComparisonMetric) => metric.unit === '%' ? 'pp' : metric.unit;
export const comparisonValue = (metric: ComparisonMetric, value: number) => `${number(value, metric.unit === 'ratio' ? 4 : 3)}${metric.unit === '%' ? '%' : metric.unit === 'ratio' ? '' : ` ${metric.unit}`}`;
export const comparisonDelta = (metric: ComparisonMetric) => `${signed(metric.treatment - metric.control, metric.unit === 'ratio' ? 4 : 3)} ${comparisonUnit(metric)}`;
export const comparisonRelative = (metric: ComparisonMetric) => {
  const relative = changeValues(metric.control, metric.treatment).relative;
  return relative === null ? 'Undefined' : `${signed(relative)}%`;
};
export const comparisonInterval = (metric: ComparisonMetric) => metric.ci
  ? `${metric.ci.map(value => signed(value, metric.unit === 'ratio' ? 4 : 3)).join(' to ')} ${comparisonUnit(metric)}`
  : 'Not supplied';

function roundedExtent(high: number) {
  const step = 10 ** Math.floor(Math.log10(high)) / 2;
  return Number((Math.ceil(high / step) * step).toPrecision(12));
}

export function comparisonBarDomain(metric: ComparisonMetric): [number, number] {
  const high = Math.max(metric.control, metric.treatment, .1);
  return [0, metric.unit === '%' ? Math.min(100, roundedExtent(high)) : roundedExtent(high)];
}

export function comparisonDeltaDomain(metrics: ComparisonMetric[]): [number, number] {
  if (new Set(metrics.map(metric => metric.unit)).size > 1) throw new Error('A shared change axis requires matching metric units.');
  const high = Math.max(0, ...metrics.flatMap(metric => [Math.abs(metric.treatment - metric.control), ...(metric.ci ?? []).map(Math.abs)]));
  const extent = high === 0 ? 1 : roundedExtent(high * 1.15);
  return [-extent, extent];
}

export function reportOverviewMetrics(metrics: Metric[], config: AnalysisConfig) {
  const visible = metrics.filter(metric => config.roles[metric.id] !== 'excluded');
  return [...visible.filter(metric => config.roles[metric.id] === 'target'),
    ...visible.filter(metric => config.roles[metric.id] === 'guardrail'),
    ...visible.filter(metric => config.roles[metric.id] === 'fundamental' && metric.unexpected),
    ...visible.filter(metric => config.roles[metric.id] === 'fundamental' && !metric.unexpected)].slice(0, 4);
}

export function reportChartGroups(metrics: Metric[]) {
  const groups = new Map<Metric['unit'], ComparisonMetric[]>();
  for (const metric of metrics) {
    const group = groups.get(metric.unit) ?? [];
    group.push(experimentComparison(metric));
    groups.set(metric.unit, group);
  }
  return [...groups].map(([unit, rows]) => ({ unit, rows }));
}
