import { datasetForUrl } from './datasets';
import { metricState } from './metric-analysis';
import type { ExperimentOption } from './experiment-catalog';
import type { ExperimentDataset } from './types';

export type LibraryDecision = 'attention' | 'ship' | 'continue' | 'unassessed';
export type LibraryFilter = 'all' | 'completed' | LibraryDecision;
export const decisionLabels: Record<LibraryDecision, string> = {
  attention: 'Needs attention', ship: 'Ready to ship', continue: 'More evidence', unassessed: 'Not assessed',
};

export function libraryDecision(data?: ExperimentDataset): { status: LibraryDecision; reason: string } {
  if (!data) return { status: 'unassessed', reason: 'Experiment data is not connected yet.' };
  if (data.caseStudy) return { status: 'attention', reason: 'Hold at 5%. Sustained-use and cancellation risks remain unresolved.' };
  const config = data.defaultConfig;
  const guardrails = data.metrics.filter(metric => config.roles[metric.id] === 'guardrail');
  const targets = data.metrics.filter(metric => config.roles[metric.id] === 'target');
  const breached = guardrails.filter(metric => metricState(metric, config).tone === 'caution');
  if (breached.length) return { status: 'attention', reason: `${breached.map(metric => metric.name).join(', ')} exceeds the configured guardrail.` };
  if (['iterate', 'stop'].includes(data.demoReport.recommendation)) return { status: 'attention', reason: 'The current readout recommends investigation before expansion.' };
  if (data.demoReport.recommendation === 'ship' && targets.length && [...targets, ...guardrails].every(metric => metricState(metric, config).tone === 'positive')) {
    return { status: 'ship', reason: 'Targets and guardrails are met. The readout recommends a gradual rollout.' };
  }
  return { status: 'continue', reason: 'Collect more evidence before making a rollout decision.' };
}

export function libraryOverview(experiments: ExperimentOption[]) {
  const decisions: Record<LibraryDecision, number> = { attention: 0, ship: 0, continue: 0, unassessed: 0 };
  let completed = 0, running = 0;
  for (const experiment of experiments) {
    decisions[libraryDecision(datasetForUrl(experiment.url)).status]++;
    if (experiment.lifecycle === 'completed') completed++;
    if (experiment.lifecycle === 'running') running++;
  }
  return { total: experiments.length, completed, running, unknownLifecycle: experiments.length - completed - running, decisions };
}

export function matchesLibraryFilter(experiment: ExperimentOption, filter: LibraryFilter) {
  if (filter === 'all') return true;
  if (filter === 'completed') return experiment.lifecycle === 'completed';
  return libraryDecision(datasetForUrl(experiment.url)).status === filter;
}
