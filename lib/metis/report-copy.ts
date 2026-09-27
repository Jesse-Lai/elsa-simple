import { absoluteChange, changeValues, metricState, metricValue, number, signed } from './metric-analysis';
import type { AnalysisConfig, Artifact, ExperimentDataset, Finding, Metric, MetricId, Report } from './types';

const unit = (metric: Metric) => metric.unit === '%' ? 'pp' : metric.unit;
const interval = (metric: Metric) => `${metric.ci?.map(value => signed(value, 3)).join(' to ')} ${unit(metric)}`;
const lowerBenefit = (metric: Metric) => !metric.ci ? NaN : metric.direction === 'up' ? metric.ci[0] : -metric.ci[1];
const observedHarm = (metric: Metric) => (metric.treatment - metric.control) * (metric.direction === 'up' ? -1 : 1);

export function metricObservation(metric: Metric) {
  const relative = changeValues(metric.control, metric.treatment).relative;
  return `${metric.name}: ${metricValue(metric, metric.control)} → ${metricValue(metric, metric.treatment)} (${absoluteChange(metric)}${relative === null ? '; relative change undefined at a zero baseline' : ` / ${signed(relative)}%`}).`;
}

export function metricConclusion(metric: Metric, config: AnalysisConfig) {
  if (!metric.ci) return 'Confidence interval and decision threshold not supplied. This source observation does not establish rollout safety.';
  const role = config.roles[metric.id], threshold = config.thresholds[metric.id], state = metricState(metric, config);
  const boundary = `${number(threshold, 3)} ${unit(metric)}`;
  if (role === 'target') {
    return `95% CI ${interval(metric)}; the lower-bound benefit is ${signed(lowerBenefit(metric), 3)} ${unit(metric)}, ${state.tone === 'positive' ? `meeting the ${boundary} minimum gain` : `so the ${boundary} minimum gain is not established`}.`;
  }
  if (role === 'guardrail') {
    const harm = observedHarm(metric), maximumHarm = -lowerBenefit(metric);
    if (state.tone === 'caution') {
      const minimumHarm = metric.direction === 'up' ? -metric.ci[1] : metric.ci[0];
      return `Observed degradation exceeds the ${boundary} limit by ${number(harm - threshold, 3)} ${unit(metric)}. The 95% CI (${interval(metric)}) ${minimumHarm <= threshold ? 'spans the limit, so the size of the breach remains uncertain' : 'lies entirely beyond the limit'}.`;
    }
    if (state.tone === 'neutral') return `95% CI ${interval(metric)} permits up to ${number(maximumHarm, 3)} ${unit(metric)} degradation against a ${boundary} limit; the boundary remains uncertain.`;
    return `95% CI ${interval(metric)} stays within the ${boundary} ${metric.direction === 'up' ? 'decrease' : 'increase'} limit.`;
  }
  return `95% CI ${interval(metric)} ${metric.ci[0] <= 0 && metric.ci[1] >= 0 ? 'includes zero; the effect remains uncertain' : `is entirely ${metric.ci[1] < 0 ? 'below' : 'above'} zero`}.${metric.unexpected ? ' This is an exploratory signal without a multiple-testing correction.' : ''}`;
}

export function dimensionConclusion(metrics: Metric[], config: AnalysisConfig) {
  return metrics.map(metric => {
    if (!metric.ci) return `${metricObservation(metric)} Confidence interval not supplied.`;
    const state = metricState(metric, config), role = config.roles[metric.id];
    const boundary = `${number(config.thresholds[metric.id], 3)} ${unit(metric)}`;
    const change = `${metric.name} ${absoluteChange(metric)}`;
    if (role === 'target') return `${change}; the ${signed(lowerBenefit(metric), 3)} ${unit(metric)} lower confidence bound ${state.tone === 'positive' ? 'meets' : 'does not establish'} the ${boundary} minimum gain.`;
    if (role === 'guardrail' && state.tone === 'caution') return `${change}; observed degradation exceeds the ${boundary} limit by ${number(observedHarm(metric) - config.thresholds[metric.id], 3)} ${unit(metric)} (95% CI ${interval(metric)}).`;
    if (role === 'guardrail') return `${change}; the ${boundary} limit ${state.tone === 'positive' ? 'is met' : 'remains uncertain'} (95% CI ${interval(metric)}).`;
    return `${change} (95% CI ${interval(metric)})${metric.ci[0] <= 0 && metric.ci[1] >= 0 ? '; the effect remains uncertain' : ''}.`;
  }).join(' ');
}

function citedMetrics(finding: Finding, data: ExperimentDataset, config: AnalysisConfig) {
  return [...new Set(finding.evidenceIds.map(id => data.evidenceById[id]?.metricId))]
    .filter((id): id is MetricId => Boolean(id && Object.hasOwn(data.metricById, id) && config.roles[id] !== 'excluded'))
    .map(id => data.metricById[id]);
}

export function segmentConclusion(metric: Metric, data: ExperimentDataset) {
  if (!['activation', 'latency'].includes(metric.id) || !data.segments.length) return '';
  const slot = metric.id as 'activation' | 'latency';
  const rows = data.segments.map(segment => ({ ...segment, delta: segment[slot][1] - segment[slot][0] }));
  const worst = [...rows].sort((a, b) => (a.delta - b.delta) * (metric.direction === 'up' ? 1 : -1))[0];
  const range = rows.map(row => row.delta);
  return `Across ${rows.length} platforms, observed changes range from ${signed(Math.min(...range), 3)} to ${signed(Math.max(...range), 3)} ${unit(metric)}. ${worst.name} has the least favorable change: ${metricValue(metric, worst[slot][0])} → ${metricValue(metric, worst[slot][1])} (${signed(worst.delta, 3)} ${unit(metric)}; ${number(worst.n)} users per arm). These comparisons are exploratory; segment confidence intervals and interaction tests are unavailable.`;
}

export function findingReadout(finding: Finding, data: ExperimentDataset, config: AnalysisConfig): Finding {
  const metrics = citedMetrics(finding, data, config), primary = metrics[0];
  if (!primary) return finding;
  const state = metricState(primary, config);
  const body = metrics.map(metric => `${metricObservation(metric)} ${metricConclusion(metric, config)}`);
  for (const metric of metrics) if (finding.evidenceIds.includes(`segment:${metric.id}`)) body.push(segmentConclusion(metric, data));
  return { ...finding, title: `${primary.name} ${absoluteChange(primary)} — ${state.label.toLowerCase()}`, body: body.filter(Boolean).join(' ') };
}

export function trendConclusion(metricId: MetricId, data: ExperimentDataset) {
  const metric = data.metricById[metricId], series = data.trends[metricId];
  if (!series?.length) return `${metric.name} has no daily series in this snapshot; only its aggregate estimate is available.`;
  const gaps = series.map(day => day.treatment - day.control);
  const higher = gaps.filter(gap => gap > 0).length, lower = gaps.filter(gap => gap < 0).length;
  const direction = higher === gaps.length ? `higher on all ${gaps.length} displayed days` : lower === gaps.length ? `lower on all ${gaps.length} displayed days` : `higher on ${higher}/${gaps.length} days and lower on ${lower}/${gaps.length}`;
  return `Treatment is ${direction}; the daily Treatment–Control gap ranges from ${signed(Math.min(...gaps), 3)} to ${signed(Math.max(...gaps), 3)} ${unit(metric)}. This illustrative series does not establish a time-dependent effect.`;
}

export function recommendationTitle(report: Report, data: ExperimentDataset, config: AnalysisConfig) {
  const visible = data.metrics.filter(metric => config.roles[metric.id] !== 'excluded');
  const breached = visible.find(metric => config.roles[metric.id] === 'guardrail' && metricState(metric, config).tone === 'caution');
  const uncertain = visible.find(metric => config.roles[metric.id] === 'guardrail' && metricState(metric, config).tone === 'neutral');
  const pending = visible.find(metric => config.roles[metric.id] === 'target' && metricState(metric, config).tone !== 'positive');
  if (breached) return `Keep rollout limited: ${breached.name.toLowerCase()} exceeds the ${number(config.thresholds[breached.id], 3)} ${unit(breached)} limit by ${number(observedHarm(breached) - config.thresholds[breached.id], 3)} ${unit(breached)}`;
  if (uncertain) return `Continue testing: ${uncertain.name.toLowerCase()} may exceed the ${number(config.thresholds[uncertain.id], 3)} ${unit(uncertain)} limit`;
  if (pending) return `Continue testing: ${pending.name.toLowerCase()} has not established the ${number(config.thresholds[pending.id], 3)} ${unit(pending)} minimum gain`;
  const target = visible.find(metric => config.roles[metric.id] === 'target');
  const next = { ship: 'Roll out gradually', iterate: 'Keep rollout limited for follow-up validation', continue: 'Continue collecting evidence', stop: 'Stop the experiment for investigation' }[report.recommendation];
  return target ? `${next}: ${target.name.toLowerCase()} ${absoluteChange(target)} meets the ${number(config.thresholds[target.id], 3)} ${unit(target)} minimum gain` : next;
}

export function objectiveHeadline(data: ExperimentDataset, config: AnalysisConfig) {
  const visible = data.metrics.filter(metric => config.roles[metric.id] !== 'excluded');
  const targets = visible.filter(metric => config.roles[metric.id] === 'target');
  if (!targets.length) return 'Select a target metric to evaluate whether the experiment meets its goal.';
  const subjects: Record<string, string> = {
    'onboarding-refresh': 'The refresh',
    'invite-flow': 'The new invite flow',
    'checkout-simplification': 'The simpler checkout',
    'pricing-page-refresh': 'The pricing refresh',
    'payment-methods': 'The updated payment flow',
  };
  const subject = subjects[data.experiment.id] ?? 'The experiment';
  const goalNames = (metrics: Metric[]) => new Intl.ListFormat('en', { type: 'conjunction' }).format(metrics.map(metric => metric.name.toLowerCase().replace(/ rate$/, '')));
  const pending = targets.filter(metric => metricState(metric, config).tone !== 'positive');
  const result = pending.length
    ? `${subject} has not yet established the required gain in ${goalNames(pending)}`
    : `${subject} meets the ${goalNames(targets)} ${targets.length === 1 ? 'goal' : 'goals'}`;
  const guardrails = visible.filter(metric => config.roles[metric.id] === 'guardrail');
  const breached = guardrails.find(metric => metricState(metric, config).tone === 'caution');
  const uncertain = guardrails.find(metric => metricState(metric, config).tone === 'neutral');
  const join = pending.length ? ', and' : ', but';
  if (breached) return `${result}${join} observed ${breached.unit === 'ms' ? 'latency exceeds the budget' : `${breached.name.toLowerCase()} exceeds its limit`}.`;
  if (uncertain) return `${result}${join} the ${uncertain.name.toLowerCase()} guardrail remains uncertain.`;
  if (pending.length) return `${result}.`;
  const unexpectedHarm = visible.find(metric => metric.unexpected && lowerBenefit(metric) < 0 && observedHarm(metric) > 0);
  if (unexpectedHarm) return `${result}, but the unexpected ${unexpectedHarm.direction === 'up' ? 'decline' : 'increase'} in ${unexpectedHarm.name.toLowerCase()} needs validation.`;
  return `${result}${guardrails.length ? ' while staying within its guardrails' : ''}.`;
}

// Derive refreshed demo copy at read time. Saved artifacts, conversations and
// finding identities remain unchanged; genuine model reports retain their text.
export function reportReadout(report: Report, data: ExperimentDataset, config: AnalysisConfig, origin?: Artifact['origin']): Report {
  if (origin !== 'demo' || data.caseStudy) return report;
  const visible = data.metrics.filter(metric => config.roles[metric.id] !== 'excluded');
  const targets = visible.filter(metric => config.roles[metric.id] === 'target');
  const guardrails = visible.filter(metric => config.roles[metric.id] === 'guardrail');
  const risk = guardrails.find(metric => metricState(metric, config).tone === 'caution') ?? guardrails.find(metric => metricState(metric, config).tone === 'neutral');
  const keyMetrics = visible.filter(metric => targets.includes(metric) || metric === risk || metric.unexpected);
  const headline = objectiveHeadline(data, config);
  const summary = keyMetrics.map(metric => {
    const state = metricState(metric, config);
    const outcome = config.roles[metric.id] === 'target' ? `${number(config.thresholds[metric.id], 3)} ${unit(metric)} minimum gain ${state.tone === 'positive' ? 'reached' : 'not established'}.` : metric === risk ? metricConclusion(metric, config) : `95% CI ${interval(metric)}${metric.ci && metric.ci[0] <= 0 && metric.ci[1] >= 0 ? ' includes zero; the effect remains uncertain' : ''}; validate this unexpected signal in a pre-specified follow-up.`;
    return `${metricObservation(metric)} ${outcome}`;
  });
  if (!risk && guardrails.length) summary.push(`${guardrails.length}/${guardrails.length} guardrails stay within their configured limits: ${guardrails.map(metric => `${metric.name.toLowerCase()} ${absoluteChange(metric)}`).join(', ')}.`);
  const nextMetric = risk ?? targets.find(metric => metricState(metric, config).tone !== 'positive') ?? targets[0];
  const nextFinding = nextMetric && report.findings.find(finding => finding.evidenceIds.includes(`metric:${nextMetric.id}`));
  if (nextFinding?.validation) summary.push(`Next: ${nextFinding.validation}`);
  return { ...report, headline, summary: summary.join(' '), findings: report.findings.map(finding => findingReadout(finding, data, config)) };
}
