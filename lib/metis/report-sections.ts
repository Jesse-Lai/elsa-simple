import { dimensionConclusion } from './report-copy';
import type { AnalysisConfig, ExperimentDataset, Finding, Metric, Report } from './types';

export const reportDimensions = [
  { id: 'target', title: 'Target metrics', description: 'Did the experiment achieve its intended outcome?', empty: 'No target metrics configured.' },
  { id: 'guardrail', title: 'Guardrail metrics', description: 'Did the gains come with an unacceptable cost?', empty: 'No guardrail metrics configured.' },
  { id: 'fundamental', title: 'Fundamental metrics', description: 'How did overall product behavior change?', empty: 'No fundamental metrics configured.' },
  { id: 'unexpected', title: 'Unexpected metrics', description: 'Unplanned changes across Target, Guardrail or Fundamental metrics.', empty: 'No unexpected changes are flagged in this snapshot. Other effects may still exist.' },
] as const;

export type ReportSection = {
  id: typeof reportDimensions[number]['id'];
  title: string;
  description: string;
  empty: string;
  metrics: Metric[];
  findings: Finding[];
};

export function organizeReport(data: ExperimentDataset, config: AnalysisConfig, report?: Report): ReportSection[] {
  const visible = data.metrics.filter(metric => config.roles[metric.id] !== 'excluded');
  const sections: ReportSection[] = reportDimensions.map(dimension => ({
    ...dimension,
    metrics: visible.filter(metric => dimension.id === 'unexpected' ? metric.unexpected : config.roles[metric.id] === dimension.id),
    findings: [],
  }));
  for (const section of sections) section.description = section.metrics.length ? dimensionConclusion(section.metrics, config) : section.empty;
  for (const finding of report?.findings ?? []) {
    // The first available cited metric anchors a finding. Unexpected is a flag,
    // so its metric also remains in the original decision/context section.
    const primary = finding.evidenceIds.map(id => data.evidenceById[id])
      .filter(ref => ref && Object.hasOwn(data.metricById, ref.metricId))
      .map(ref => data.metricById[ref.metricId])
      .find(metric => config.roles[metric.id] !== 'excluded');
    if (!primary) continue;
    const section = sections.find(section => section.id === (primary.unexpected ? 'unexpected' : config.roles[primary.id]));
    section?.findings.push(finding);
  }
  return sections;
}

export function findingPopulation(finding: Finding, data: ExperimentDataset) {
  const refs = finding.evidenceIds.map(id => data.evidenceById[id]).filter(ref => ref && Object.hasOwn(data.metricById, ref.metricId));
  const metric = refs[0] && data.metricById[refs[0].metricId];
  if (!metric) return 'The affected population cannot be determined from the available evidence.';
  const hasSegments = refs.some(ref => ref.kind === 'segment');
  return `${metric.description} ${hasSegments ? 'Platform comparisons are exploratory and do not establish a cause.' : 'Affected subgroups cannot be identified from this aggregate evidence.'}`;
}
