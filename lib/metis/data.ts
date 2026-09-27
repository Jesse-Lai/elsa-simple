import type { AnalysisConfig, EvidenceRef, Experiment, Metric, MetricId, Report, Workspace } from './types';

export const DEMO_URL = 'https://experiments.example.com/onboarding-refresh';
export const experiment: Experiment = {
  id: 'onboarding-refresh', group: 'Growth & activation', name: 'Onboarding refresh', url: DEMO_URL,
  snapshotId: 'onboarding-2026-09-14-v1', start: 'Sep 1', end: 'Sep 14, 2026', controlN: 24000, treatmentN: 24000,
  objective: 'Help new users reach their first meaningful moment, without making onboarding slower or less reliable.',
};
export const metrics: Metric[] = [
  { id: 'activation', name: 'Activation rate', description: 'New users completing a first meaningful action within 24 hours.', unit: '%', control: 32.4, treatment: 35.1, ci: [1.85, 3.55], direction: 'up', role: 'target', threshold: 1 },
  { id: 'latency', name: 'Onboarding latency', description: '95th percentile time to interactive across onboarding sessions.', unit: 'ms', control: 820, treatment: 884, ci: [42, 86], direction: 'down', role: 'guardrail', threshold: 50 },
  { id: 'crashes', name: 'Crash rate', description: 'Share of onboarding sessions ending in an application crash.', unit: '%', control: 0.42, treatment: 0.43, ci: [-0.025, 0.045], direction: 'down', role: 'guardrail', threshold: 0.05 },
  { id: 'retention', name: 'Day 7 retention', description: 'Return rate for the fully matured first seven enrollment cohorts; 12,000 users per arm.', unit: '%', control: 24.8, treatment: 23.7, ci: [-2.18, -0.02], direction: 'up', role: 'fundamental', threshold: 0, unexpected: true },
  { id: 'sessions', name: 'Sessions per user', description: 'Average sessions per enrolled user during the observation period.', unit: '/user', control: 3.2, treatment: 3.28, ci: [-0.01, 0.17], direction: 'up', role: 'fundamental', threshold: 0 },
];
export const metricById = Object.fromEntries(metrics.map(m => [m.id, m])) as Record<MetricId, Metric>;
export const defaultConfig: AnalysisConfig = {
  analysisMode: 'scorecard-review',
  objective: experiment.objective, requirements: '',
  roles: Object.fromEntries(metrics.map(m => [m.id, m.role])) as AnalysisConfig['roles'],
  thresholds: Object.fromEntries(metrics.map(m => [m.id, m.threshold])) as AnalysisConfig['thresholds'],
};
const activationControl = [32.2, 32.5, 32.1, 32.6, 32.3, 32.7, 32.2, 32.4, 32.1, 32.5, 32.3, 32.6, 32.4, 32.7];
const activationTreatment = [33.3, 33.9, 34.4, 34.8, 35.0, 35.3, 35.6, 35.2, 35.6, 35.8, 35.5, 35.7, 35.6, 35.7];
export const trends = Object.fromEntries(metrics.filter(m => m.id !== 'retention').map(m => [m.id, Array.from({ length: 14 }, (_, i) => ({
  date: `Sep ${i + 1}`,
  control: m.id === 'activation' ? activationControl[i] : Number((m.control + Math.sin(i * 1.7) * m.control * 0.014).toFixed(2)),
  treatment: m.id === 'activation' ? activationTreatment[i] : Number((m.treatment + Math.sin(i * 1.6 + 1) * m.treatment * 0.017).toFixed(2)),
}))])) as Partial<Record<MetricId, { date: string; control: number; treatment: number }[]>>;
export const segments = [
  { id: 'desktop', name: 'Desktop', n: 12000, activation: [33.8, 36.8], latency: [680, 704], note: 'Positive activation signal', tone: 'positive' },
  { id: 'ios', name: 'iOS', n: 6000, activation: [32.2, 35.0], latency: [840, 870], note: 'Positive activation signal', tone: 'positive' },
  { id: 'android-high', name: 'Android · higher-end', n: 3600, activation: [31.7, 34.0], latency: [930, 976], note: 'Near the latency boundary', tone: 'neutral' },
  { id: 'android-low', name: 'Android · lower-end', n: 2400, activation: [26.95, 28.7], latency: [1240, 1438], note: 'Latency needs investigation', tone: 'caution' },
] as const;
export const evidence: EvidenceRef[] = [
  ...metrics.map(m => ({ id: `metric:${m.id}`, title: m.name, metricId: m.id, kind: 'metric' as const })),
  ...metrics.filter(m => trends[m.id]).map(m => ({ id: `trend:${m.id}`, title: `${m.name} · daily trend`, metricId: m.id, kind: 'trend' as const })),
  { id: 'segment:latency', title: 'Latency by platform', metricId: 'latency', kind: 'segment' },
  { id: 'segment:activation', title: 'Activation by platform', metricId: 'activation', kind: 'segment' },
];
export const evidenceById = Object.fromEntries(evidence.map(e => [e.id, e])) as Record<string, EvidenceRef>;
export const demoReport: Report = {
  shortTitle: 'Activation gains, latency risk',
  headline: 'A stronger start. One important trade-off.',
  summary: 'The new onboarding helps more people activate. Latency crosses the agreed guardrail, and an unexpected retention signal deserves a closer look. Keep the rollout limited while you investigate.',
  recommendation: 'iterate',
  findings: [
    { title: 'More users reach their first meaningful moment', body: 'Activation improves beyond the minimum useful gain. The direction is consistent across the observed platforms.', tone: 'positive', evidenceIds: ['metric:activation', 'trend:activation', 'segment:activation'], hypothesis: 'A clearer path to the first action may reduce onboarding friction.', validation: 'Verify which onboarding steps account for the lift using step-level funnel instrumentation.' },
    { title: 'Lower-end Android is the next place to look', body: 'Overall latency exceeds the guardrail. The largest observed increase is on lower-end Android devices; the segment pattern is exploratory, not a proven cause.', tone: 'caution', evidenceIds: ['metric:latency', 'segment:latency'], hypothesis: 'The refreshed flow may require more work on devices with limited resources.', validation: 'Profile the new flow on lower-end Android and validate a lighter variant in a follow-up experiment.' },
    { title: 'The first-week return signal needs follow-up', body: 'Day 7 retention moves in an unfavorable direction among matured cohorts. This was not the original hypothesis and has not been adjusted for multiple comparisons.', tone: 'caution', evidenceIds: ['metric:retention'], hypothesis: 'Early activation may not translate into a durable habit for every user.', validation: 'Pre-register retention as a guardrail and collect additional matured cohorts before making a causal claim.' },
  ],
  limitations: ['All values are synthetic demonstration data, with precomputed estimates and illustrative daily trends.', 'Segment results are exploratory. No interaction tests or multiple-comparison corrections are available.', 'Day 7 retention uses only fully matured cohorts. A non-significant result does not establish no effect.'],
};
export function initialWorkspace(): Workspace {
  return { version: 1, selectedBranchId: 'main', view: 'home', branches: [{
    id: 'main', experimentId: experiment.id, parentId: null, name: 'Main analysis', snapshotId: experiment.snapshotId,
    context: '', evidenceIds: [], config: structuredClone(defaultConfig),
    artifacts: [{ id: 'demo-report', config: structuredClone(defaultConfig), title: 'Experiment report', kind: 'report', metricId: 'activation', evidenceIds: evidence.map(e => e.id), report: structuredClone(demoReport), origin: 'demo' }],
    messages: [{ id: 'welcome', role: 'assistant', origin: 'demo', text: 'The refreshed onboarding improves activation, but the latency trade-off makes a full rollout premature. I would investigate lower-end Android first, then validate the retention signal with more matured cohorts.', evidenceIds: ['metric:activation', 'segment:latency', 'metric:retention'], status: 'complete' }], actions: [], runs: [],
  }] };
}
