import { experiment } from './data';
import { datasets } from './datasets';

export type ExperimentOption = { id: string; name: string; group: string; url: string; ownerId?: string; lifecycle?: 'running' | 'completed' };
export type ScorecardOption = ExperimentOption & { experimentId: string };

// Ownership for the local sample catalog; replace with the signed-in platform user when connected.
export const currentUserId = 'jesse-lai';

// Picker metadata. Lifecycle values are illustrative for synthetic experiments;
// source-only and disconnected experiments stay unknown until the platform supplies them.
export const experimentOptions: ExperimentOption[] = [
  { ...experiment, ownerId: currentUserId, lifecycle: 'completed' },
  ...datasets.filter(data=>data.caseStudy).map(data=>data.experiment),
  { id: 'checkout-simplification', name: 'Checkout simplification', group: 'Conversion', url: 'https://experiments.example.com/checkout-simplification', ownerId: currentUserId, lifecycle: 'completed' },
  { id: 'search-relevance', name: 'Search relevance', group: 'Discovery', url: 'https://experiments.example.com/search-relevance' },
  { id: 'pricing-page-refresh', name: 'Pricing page refresh', group: 'Conversion', url: 'https://experiments.example.com/pricing-page-refresh', lifecycle: 'running' },
  { id: 'invite-flow', name: 'Invite flow', group: 'Growth & activation', url: 'https://experiments.example.com/invite-flow', ownerId: currentUserId, lifecycle: 'completed' },
  { id: 'email-reactivation', name: 'Email reactivation', group: 'Retention', url: 'https://experiments.example.com/email-reactivation' },
  { id: 'payment-methods', name: 'Payment methods', group: 'Conversion', url: 'https://experiments.example.com/payment-methods', lifecycle: 'completed' },
];

// Each available scorecard resolves to its saved experiment snapshot, not a conversation.
export const scorecardOptions: ScorecardOption[] = datasets.map(({ experiment }) => ({
  id: experiment.snapshotId,
  experimentId: experiment.id,
  name: `${experiment.name} scorecard`,
  group: experiment.group,
  url: experiment.url,
}));

export function scorecardsForGroup(groupName: string, additionalUrls: string[] = []) {
  return scorecardOptions.filter(option => option.group === groupName || additionalUrls.includes(option.url));
}

function normalizedUrl(value: string) {
  try {
    const url = new URL(value);
    return url.origin + url.pathname.replace(/\/$/, '');
  } catch { return undefined; }
}

export function selectedScorecard(value: string, groupName: string, additionalUrls: string[] = []) {
  const id = value.trim().toLowerCase();
  const url = normalizedUrl(value);
  return scorecardsForGroup(groupName, additionalUrls).find(option => option.id === id || option.experimentId === id || option.url === url);
}

export const navigationGroups = ['Growth & activation', 'Conversion'].map(name => ({
  name,
  experiments: experimentOptions.filter(option => option.group === name),
}));

export function selectedExperiment(value: string) {
  const id = value.trim().toLowerCase();
  const url = normalizedUrl(value);
  const sourceCase=datasets.find(data=>data.caseStudy&&[data.caseStudy.treatmentId,data.caseStudy.controlId].some(arm=>arm.toLowerCase()===id));
  return sourceCase?.experiment??experimentOptions.find(option => option.id === id || option.url === url);
}
