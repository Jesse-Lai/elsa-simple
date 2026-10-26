// Presentation samples supplied in Figma frame 306:4331; not live experiment results.
export const libraryReports = [
  {
    id: 'bebop-engagement-report',
    title: 'Design Flight – User Engagement Impact Analysis',
    date: 'Sep 14, 2026',
    image: '/design/report-engagement.png',
    summary: 'This report evaluates Bebop’s impact on user engagement, comparing treatment vs. control across key metrics. Results show a +4.5% increase in engagement and reveal opportunities to improve retention.',
  },
  {
    id: 'bebop-revenue-report',
    title: 'Bebop Design Flight – Revenue Impact Analysis',
    date: 'Sep 14, 2026',
    image: '/design/report-revenue.png',
    summary: 'This report evaluates Bebop’s design impact on revenue, comparing treatment vs. control across key metrics. Results show a +3.2% revenue lift and identify opportunities for further growth.',
  },
];

export type ReportMetric = { name: string; control: number; treatment: number; unit: '%' | '$' | ''; change: string; tone: 'positive' | 'caution' | 'neutral' };
export type ReportDetail = {
  headline: string; takeaway: string; metrics: ReportMetric[];
  trendLabel: string; trendUnit: '%' | '$'; trend: { day: string; control: number; treatment: number }[];
  segments: { name: string; lift: number }[]; segmentNote: string;
  findings: { title: string; detail: string; next: string }[];
};

// Fictional report examples, separate from the source-backed Bebop experiment.
const days = ['Sep 1', 'Sep 3', 'Sep 5', 'Sep 7', 'Sep 9', 'Sep 11', 'Sep 14'];
export const libraryReportDetails: Record<string, ReportDetail> = {
  'bebop-engagement-report': {
    headline: 'Engagement improves; retention needs a follow-up.',
    takeaway: 'Engagement rises 4.5% relative to control, with stronger gains among new users. Day 7 retention is slightly lower, so the initial lift does not yet establish sustained value.',
    metrics: [
      { name: 'Engaged users', control: 40, treatment: 41.8, unit: '%', change: '+4.5% relative', tone: 'positive' },
      { name: 'Sessions per user', control: 3.2, treatment: 3.28, unit: '', change: '+2.5% relative', tone: 'positive' },
      { name: 'Day 7 retention', control: 26.4, treatment: 26.1, unit: '%', change: '−0.3 pp', tone: 'caution' },
    ],
    trendLabel: 'Daily engaged users', trendUnit: '%',
    trend: days.map((day, i) => ({ day, control: [39.4, 40.2, 39.8, 40.5, 39.9, 40.1, 40.1][i], treatment: [40.3, 41.1, 41.4, 42.5, 41.8, 42.3, 43.2][i] })),
    segments: [{ name: 'New users', lift: 7.2 }, { name: 'Returning users', lift: 2.7 }],
    segmentNote: 'Relative engagement lift by user tenure. New users show the larger initial response.',
    findings: [
      { title: 'New users respond more strongly', detail: 'The 7.2% engagement lift among new users exceeds the 2.7% lift among returning users. Easier discovery is a plausible explanation, not a confirmed cause.', next: 'Split the entry-to-first-action funnel by user tenure and test the entry-point change independently.' },
      { title: 'More sessions have not translated into better retention', detail: 'Sessions per user increase, while Day 7 retention falls from 26.4% to 26.1%. Short-term activity alone is insufficient for an expansion decision.', next: 'Keep exposure limited and measure completed tasks and retention in additional matured cohorts.' },
    ],
  },
  'bebop-revenue-report': {
    headline: 'Revenue improves through conversion, with lower spend per payer.',
    takeaway: 'Revenue per exposed user rises 3.2%. More users become paying customers, while revenue per payer declines slightly. Validate that the lift persists after refunds and renewals.',
    metrics: [
      { name: 'Revenue per exposed user', control: 2.5, treatment: 2.58, unit: '$', change: '+3.2% relative', tone: 'positive' },
      { name: 'Paid conversion', control: 4, treatment: 4.2, unit: '%', change: '+0.2 pp', tone: 'positive' },
      { name: 'Revenue per payer', control: 62.5, treatment: 61.43, unit: '$', change: '−1.7% relative', tone: 'caution' },
    ],
    trendLabel: 'Daily revenue per exposed user', trendUnit: '$',
    trend: days.map((day, i) => ({ day, control: [0.16, 0.18, 0.17, 0.19, 0.18, 0.17, 0.2][i], treatment: [0.161, 0.184, 0.178, 0.198, 0.187, 0.175, 0.208][i] })),
    segments: [{ name: 'New users', lift: 5.4 }, { name: 'Returning users', lift: 1.8 }],
    segmentNote: 'Relative revenue-per-user lift by user tenure. The gain is larger among new users.',
    findings: [
      { title: 'Conversion accounts for the overall revenue gain', detail: 'Paid conversion increases from 4.0% to 4.2%, offsetting the drop in revenue per payer. The new experience may help more users reach purchase.', next: 'Inspect purchase-funnel completion by entry point and plan tier to locate the conversion gain.' },
      { title: 'Lower spend per payer needs a plan-mix check', detail: 'Revenue per payer falls from $62.50 to $61.43. A shift toward lower-priced plans could explain the pattern; the current summary cannot confirm it.', next: 'Break down plan mix, discounts and refunds, then follow the cohort through its first renewal.' },
    ],
  },
};
