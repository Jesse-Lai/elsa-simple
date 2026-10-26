export type BreakdownMetric = 'early-sat' | 'message-dau' | 'chat-retained';
export type BreakdownGroup = 'treatment' | 'control';
export type Slice = { label: string; value: number };
export type RelatedMetric = { name: string; unit: '%' | 'count' | 's'; values: number[] };
export type Breakdown = { daily: number[]; users: Slice[]; countries: Slice[]; related: RelatedMetric[] };

export const breakdownMetrics: { id: BreakdownMetric; name: string }[] = [
  { id: 'early-sat', name: 'SAT Rate' },
  { id: 'message-dau', name: 'Message DAU' },
  { id: 'chat-retained', name: 'Chat Retained' },
];

// Design fixtures, not observed telemetry. Keep the visible illustrative-data
// label with these readouts until a real, consistently scoped data source exists.
const slices = (labels: string[], values: number[]): Slice[] => labels.map((label, i) => ({ label, value: values[i] }));
const users = (values: number[]) => slices(['New users', 'Returning users'], values);
const countries = (values: number[]) => slices(['United States', 'United Kingdom', 'India', 'Japan'], values);
const related = (name: string, unit: RelatedMetric['unit'], values: number[]): RelatedMetric => ({ name, unit, values });

export const metricBreakdowns: Record<BreakdownMetric, Record<BreakdownGroup, Breakdown>> = {
  'early-sat': {
    treatment: {
      daily: [83.2, 82.5, 81.8, 80.1, 80.6, 79.8, 79.1],
      users: users([74.6, 81.8]), countries: countries([80.4, 82.1, 75.8, 78.6]),
      related: [related('Stop generation', '%', [1.3, 1.38, 1.42, 1.6, 1.55, 1.7, 1.79]), related('DSAT-labeled turns', '%', [1.7, 1.76, 1.81, 1.96, 2.02, 2.08, 2.18]), related('Thumbs-down', '%', [.12, .12, .11, .12, .11, .11, .11])],
    },
    control: {
      daily: [83.2, 83.6, 83.1, 83.7, 83.4, 83.2, 83.5],
      users: users([80.8, 84.9]), countries: countries([84.2, 85.1, 81.6, 82.8]),
      related: [related('Stop generation', '%', [1.28, 1.31, 1.29, 1.32, 1.3, 1.31, 1.3]), related('DSAT-labeled turns', '%', [1.68, 1.72, 1.69, 1.73, 1.7, 1.71, 1.7]), related('Thumbs-down', '%', [.12, .11, .12, .13, .12, .12, .12])],
    },
  },
  'message-dau': {
    treatment: {
      daily: [19.1, 19.3, 18.9, 18.7, 18.5, 18.3, 18.2],
      users: users([14.2, 21.3]), countries: countries([19.4, 20.1, 16.2, 17.1]),
      related: [related('ZQ click rate', '%', [2.8, 3.7, 4.5, 5.1, 5.8, 6.1, 6.27]), related('Sessions / user', 'count', [3.72, 3.7, 3.66, 3.64, 3.61, 3.58, 3.56]), related('Messages / active user', 'count', [8.4, 8.3, 8.1, 8.2, 7.9, 7.8, 7.7])],
    },
    control: {
      daily: [18.8, 19.0, 18.7, 18.9, 18.6, 18.8, 18.7],
      users: users([16.1, 20.6]), countries: countries([19.7, 20.4, 17.1, 17.8]),
      related: [related('ZQ click rate', '%', [2.31, 2.36, 2.3, 2.34, 2.32, 2.35, 2.33]), related('Sessions / user', 'count', [3.68, 3.7, 3.67, 3.72, 3.69, 3.7, 3.69]), related('Messages / active user', 'count', [8.2, 8.3, 8.1, 8.2, 8.3, 8.2, 8.2])],
    },
  },
  'chat-retained': {
    treatment: {
      daily: [60.4, 60.1, 59.8, 59.2, 59.5, 58.7, 58.2],
      users: users([45.2, 64.6]), countries: countries([60.1, 61.4, 54.7, 57.3]),
      related: [related('Completed sessions', '%', [94.5, 94.1, 93.8, 93.5, 93.6, 93.1, 92.8]), related('App reliability', '%', [99.7, 99.6, 99.5, 99.3, 99.2, 99.1, 99.0]), related('Response time P95', 's', [1.62, 1.65, 1.64, 1.69, 1.68, 1.71, 1.7])],
    },
    control: {
      daily: [60.1, 60.3, 60.0, 59.8, 60.2, 60.0, 59.9],
      users: users([49.3, 65.1]), countries: countries([61.2, 62.5, 56.9, 58.8]),
      related: [related('Completed sessions', '%', [94.4, 94.5, 94.3, 94.5, 94.4, 94.3, 94.4]), related('App reliability', '%', [99.8, 99.8, 99.7, 99.9, 99.8, 99.8, 99.8]), related('Response time P95', 's', [1.68, 1.7, 1.67, 1.69, 1.71, 1.69, 1.7])],
    },
  },
};

export function formatReadout(value: number, unit: RelatedMetric['unit'] = '%') {
  return `${Number(value.toFixed(2))}${unit === '%' ? '%' : unit === 's' ? ' s' : ''}`;
}

export function formatChange(values: number[], unit: RelatedMetric['unit'] = '%') {
  const delta = Number((values[values.length - 1] - values[0]).toFixed(2));
  return `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta)}${unit === '%' ? ' pp' : unit === 's' ? ' s' : ''}`;
}
