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

export const bebopContext = {
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
