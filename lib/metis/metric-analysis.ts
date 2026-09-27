import type { AnalysisConfig, Metric } from './types';

export function changeValues(control: number, treatment: number) { return { absolute: treatment - control, relative: control === 0 ? null : ((treatment - control) / control) * 100 }; }
export const number = (n: number, digits = 2) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(n);
export const signed = (n: number, digits = 2) => `${n > 0 ? '+' : ''}${number(n, digits)}`;
export function metricValue(metric: Metric, value: number) { return `${number(value)}${metric.unit === '/user' ? '' : metric.unit === 'ms' ? ' ms' : '%'}`; }
export function absoluteChange(metric: Metric) { return `${signed(metric.treatment - metric.control)} ${metric.unit === '%' ? 'pp' : metric.unit === 'ms' ? 'ms' : '/user'}`; }
export function metricState(m: Metric, config: AnalysisConfig): { label: string; tone: string } {
  if (!m.ci || m.threshold === null) return {label:'Not established',tone:'neutral'};
  const role = config.roles[m.id], d = m.treatment - m.control, adjusted = d * (m.direction === 'up' ? 1 : -1), threshold = config.thresholds[m.id];
  const excludesZero = m.ci[0] > 0 || m.ci[1] < 0;
  const lowerBenefit = m.direction === 'up' ? m.ci[0] : -m.ci[1];
  if (role === 'guardrail') return adjusted < -threshold ? { label: 'Boundary exceeded', tone: 'caution' } : lowerBenefit < -threshold ? { label: 'Boundary uncertain', tone: 'neutral' } : { label: 'Within boundary', tone: 'positive' };
  if (role === 'target') return lowerBenefit >= threshold && excludesZero ? { label: 'Target reached', tone: 'positive' } : { label: 'Needs more evidence', tone: 'neutral' };
  return m.unexpected ? { label: 'Unexpected signal', tone: 'caution' } : { label: excludesZero ? 'Observed change' : 'Inconclusive', tone: 'neutral' };
}
export function metricRule(metric: Metric, config: AnalysisConfig) {
  if (metric.threshold === null) return 'No decision boundary supplied';
  const unit = metric.unit === '%' ? 'pp' : metric.unit;
  const threshold = `${number(config.thresholds[metric.id], 3)} ${unit}`;
  const role = config.roles[metric.id];
  if (role === 'target') return `${metric.direction === 'up' ? 'Increase' : 'Decrease'} by at least ${threshold}`;
  if (role === 'guardrail') return `Allow at most ${threshold} ${metric.direction === 'up' ? 'decrease' : 'increase'}`;
  return 'Context metric · No decision boundary';
}
export function metricInterpretation(metric: Metric, config: AnalysisConfig) {
  if (!metric.ci) return 'No confidence interval is supplied. Statistical precision and rollout safety are not established.';
  const state = metricState(metric, config);
  if (config.roles[metric.id] === 'target') return state.tone === 'positive' ? 'The confidence interval clears the minimum useful gain.' : 'The minimum useful gain is not established by the confidence interval.';
  if (config.roles[metric.id] === 'guardrail') return state.tone === 'caution' ? 'The observed harm exceeds the allowed boundary.' : state.tone === 'neutral' ? 'The interval includes harm beyond the allowed boundary.' : 'The confidence interval remains within the allowed boundary.';
  if (metric.ci[0] <= 0 && metric.ci[1] >= 0) return 'The interval includes zero; the effect remains uncertain.';
  return 'An observed change in overall product behavior; interpret it in the experiment context.';
}
