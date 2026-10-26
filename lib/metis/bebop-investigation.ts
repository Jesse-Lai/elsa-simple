import type { CaseMetric } from './case-study-types';

// Normalize only the presentation. Source records and their reported deltas stay intact.
export function investigationMetric(metric: CaseMetric): CaseMetric {
  const names: Record<string, string> = {
    'early-sat': 'SAT Rate',
    'zq-engagement': 'ZQ clicks',
    'stop-generating': 'Stop generation rate',
    'non-zq-cancel': 'Non-ZQ stop generation',
    'early-thumbs-down': 'Thumbs-down rate',
  };
  return {
    ...metric,
    name: names[metric.id] ?? metric.name,
    ...(metric.unit === 'ratio' ? { control: metric.control * 100, treatment: metric.treatment * 100, unit: '%' as const } : {}),
  };
}

export function metricPeriod(metric: CaseMetric): string {
  if (metric.group === 'early') return 'Mar 31–Apr 4';
  if (metric.group === 'cancel') return 'Apr 13 view · window unspecified';
  if (['chat-retained', 'app-reliability', 'uplt'].includes(metric.id)) return 'Window unspecified';
  if (metric.sourceIds.includes('P2-image')) return 'Mar 31–Apr 11';
  return 'Mar 31–Apr 12';
}

export const bebopContext = {
  sampleBalance: {
    control: 47033,
    treatment: 47844,
    pValue: '0.0085',
    sourceIds: ['S08'],
  },
  twoDayEngagement: {
    direction: 'down',
    control: null,
    treatment: null,
    sourceIds: ['S02'],
    note: 'Lower two-day engagement is reported in the discussion. Numeric values and mature cohort counts were not supplied.',
  },
  toggleUsage: {
    percent: 10,
    approximate: true,
    denominator: 'sessions',
    sourceIds: ['S05'],
    note: 'Sessions that previously used Web/Work switching; not a click-through rate or an A/B effect.',
  },
  queryMix: {
    controlLabel: 'Non-Bebop (False)',
    treatmentLabel: 'Bebop (True)',
    rows: [
      { name: 'Work queries', control: 55.68, treatment: 58.11 },
      { name: 'Web queries', control: 44.07, treatment: 41.88 },
    ],
    sourceIds: ['S04'],
    note: 'Observed query shares, not toggle clicks. Window and denominators are not shown; displayed shares are not normalized.',
  },
};

// Detail copy is grounded in the supplied case. Audience observations and
// review milestones are not quantitative slices or a daily metric series.
export const bebopDetails = {
  'early-sat': {
    scenarioTitle: 'Cancellation across entry points',
    related: ['early-dsat', 'early-thumbs-down'],
    relatedTitle: 'Inferred dissatisfaction vs explicit feedback',
    insight: 'Cancellation rises in both paths; explicit thumbs-down is inconclusive.',
    audience: [
      { label: 'Premium', text: 'Web/Work switching was removed.' },
      { label: 'Starter', text: 'No equivalent switch removal; it cannot explain both cohorts on its own.' },
    ],
    audienceCheck: 'Next check: cancellation by license and prior switch use.',
    time: [
      { label: 'Early scorecard', text: 'Inferred SAT falls; explicit thumbs-down has no significant difference.' },
      { label: 'Follow-up review', text: 'Stop generation is identified as the main DSAT signal; the cause remains open.' },
    ],
    timeCheck: 'Next check: time from first feedback to cancellation.',
  },
  'message-dau': {
    scenarioTitle: 'Entry gains vs repeat use',
    related: ['zq-engagement', 'sessions-per-user'],
    relatedTitle: '',
    insight: 'More ZQ engagement accompanies fewer sessions per user; the user journey is unverified.',
    audience: [
      { label: 'ZQ users', text: 'Higher ZQ engagement does not identify who returns.' },
      { label: 'Other users', text: 'Non-ZQ cancellation also rises; a ZQ-only explanation is insufficient.' },
    ],
    audienceCheck: 'Next check: new vs returning users, split by ZQ exposure.',
    time: [
      { label: 'Early scorecard', text: 'Message DAU is lower in Treatment: 27.40% vs 27.80%.' },
      { label: 'Later summary', text: 'Treatment remains lower: 18.18% vs 18.65%. These windows are not a daily trend.' },
    ],
    timeCheck: 'Next check: aligned daily A/B comparisons and mature return cohorts.',
  },
  'chat-retained': {
    scenarioTitle: 'Reliability and waiting signals',
    related: ['app-reliability', 'uplt'],
    relatedTitle: '',
    insight: 'Reliability falls while aggregate P95 is unchanged; neither establishes the retention cause.',
    audience: [
      { label: 'Return behavior', text: 'Lower two-day engagement is also reported in the review.' },
      { label: 'Attribution', text: 'No linked completion-to-return cohort identifies which users drive the decline.' },
    ],
    audienceCheck: 'Next check: retention by completed vs cancelled sessions.',
    time: [
      { label: 'Current readout', text: 'Chat Retained is 58.2% vs 59.9%; the observation window is unspecified.' },
      { label: 'Recovery outlook', text: 'Recovery was forecast, but no follow-up result confirms it.' },
    ],
    timeCheck: 'Next check: mature return cohorts before judging recovery.',
  },
} as const;
