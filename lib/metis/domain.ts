import { exportCaseStudy } from './case-study';
import { getDataset, onboardingDataset } from './datasets';
import { recommendationTitle, reportReadout, trendConclusion } from './report-copy';
import { findingPopulation, organizeReport } from './report-sections';
import { changeValues, number, signed, metricValue, absoluteChange, metricState, metricRule, metricInterpretation } from './metric-analysis';
import type { ActionItem, AnalysisBranch, AnalysisConfig, Artifact, Finding, Metric, Report, Workspace, ExperimentDataset } from './types';

export const uid = () => crypto.randomUUID();
export { changeValues, number, signed, metricValue, absoluteChange, metricState, metricRule, metricInterpretation } from './metric-analysis';
export function validEvidence(ids: string[], dataset: ExperimentDataset = onboardingDataset) { return ids.length > 0 && ids.every(id => Object.hasOwn(dataset.evidenceById,id)); }
export function validateReport(report: Report, config?: AnalysisConfig, dataset: ExperimentDataset = onboardingDataset) {
  const {metrics} = dataset;
  if(dataset.caseStudy&&report.recommendation==='ship')throw new Error('The supplied case contains no evidence supporting expansion.');
  if (!report.findings.length || report.findings.some(f => !validEvidence(f.evidenceIds,dataset))) throw new Error('The analysis cited evidence that is not available in this experiment. Please retry.');
  if (config && report.recommendation === 'ship') {
    const decisionMetrics = metrics.filter(m => ['target', 'guardrail'].includes(config.roles[m.id]));
    if (decisionMetrics.some(m => metricState(m, config).tone !== 'positive')) throw new Error('The rollout recommendation conflicts with the configured targets or guardrails. Please retry.');
  }
  return report;
}
export function updateBranch(state: Workspace, id: string, update: (branch: AnalysisBranch) => AnalysisBranch): Workspace {
  return { ...state, branches: state.branches.map(b => b.id === id ? update(b) : b) };
}
export function createBranch(state: Workspace, source: AnalysisBranch, title: string, context: string, evidenceIds: string[]): Workspace {
  const {evidenceById} = getDataset(source.experimentId);
  if (evidenceIds.some(id => !Object.hasOwn(evidenceById,id))) throw new Error('Unknown evidence');
  const parentId = source.parentId ?? source.id;
  const existing = state.branches.find(b => b.parentId === parentId && b.name.toLowerCase() === title.trim().toLowerCase() && b.context === context);
  if (existing) return { ...state, selectedBranchId: existing.id, view: 'workspace' };
  const branch: AnalysisBranch = { id: uid(), parentId, groupName: source.groupName, experimentId: source.experimentId, name: title.trim(), snapshotId: source.snapshotId, context, evidenceIds: [...evidenceIds], config: structuredClone(source.config), artifacts: [], messages: [{ id: uid(), role: 'assistant', origin: getDataset(source.experimentId).caseStudy?'source':'demo', text: `This branch is focused on: ${(context || title).replace(/[.!?]+$/, '')}. It inherits the experiment data and analysis settings. Run an analysis or ask a question to explore it.`, evidenceIds: [...evidenceIds] }], actions: [], runs: [] };
  return { ...state, selectedBranchId: branch.id, view: 'workspace', branches: [...state.branches, branch] };
}
export function createConversation(state: Workspace, id: string, groupName: string, config: AnalysisConfig, dataset: ExperimentDataset = onboardingDataset): Workspace {
  const {experiment} = dataset;
  if (state.branches.some(b => b.id === id)) return { ...state, selectedBranchId: id, view: 'workspace' };
  const prompt = config.requirements.trim();
  const conversation: AnalysisBranch = {
    id, parentId: null, groupName, experimentId: experiment.id, snapshotId: experiment.snapshotId,
    name: prompt ? prompt.replace(/\s+/g, ' ').slice(0, 80) : `${experiment.name} analysis`,
    context: prompt, evidenceIds: [], config: structuredClone(config), artifacts: [], actions: [], runs: [],
    messages: prompt ? [{ id: `${id}-prompt`, role: 'user', origin: 'user', text: prompt, evidenceIds: [], status: 'complete' }] : [],
  };
  return { ...state, branches: [...state.branches, conversation], selectedBranchId: id, view: 'workspace' };
}
export function addAction(branch: AnalysisBranch, finding: Finding): AnalysisBranch {
  const sourceKey = `${finding.title}:${[...finding.evidenceIds].sort().join(',')}`;
  if (branch.actions.some(a => a.sourceKey === sourceKey)) return branch;
  const action: ActionItem = { id: uid(), sourceKey, title: finding.title, hypothesis: finding.hypothesis, validation: finding.validation, evidenceIds: finding.evidenceIds, priority: finding.tone === 'caution' ? 'High' : 'Medium', owner: '', successSignal: '', completed: false };
  return { ...branch, actions: [...branch.actions, action] };
}
export function evidenceArtifact(id: string, dataset: ExperimentDataset = onboardingDataset): Artifact {
  const {evidenceById,metricById} = dataset;
  if (!Object.hasOwn(evidenceById,id)) throw new Error('Unknown evidence');
  const ref = evidenceById[id];
  if(dataset.caseStudy&&!['metric:activation','segment:crashes'].includes(id))throw new Error('No comparison artifact is available for this source; open its original evidence.');
  if(dataset.caseStudy)return {id:`evidence-comparison-${ref.metricId}`,kind:'comparison',title:metricById[ref.metricId].name,metricId:ref.metricId,evidenceIds:[id],origin:'source'};
  return { id: `evidence-${ref.kind === 'segment' ? 'segments' : 'trend'}-${ref.metricId}`, kind: ref.kind === 'segment' ? 'segments' : 'trend', title: ref.kind === 'segment' ? 'Platform breakdown' : metricById[ref.metricId].name, metricId: ref.metricId, evidenceIds: [id], origin: 'user' };
}
export function exportReport(branch: AnalysisBranch, report?: Report) {
  const data = getDataset(branch.experimentId);
  if(data.caseStudy)return exportCaseStudy(data.caseStudy,branch,report);
  const {experiment,evidenceById} = data;
  const origin = branch.artifacts.find(artifact => artifact.report === report)?.origin ?? (report === data.demoReport ? 'demo' : undefined);
  const readout = report ? reportReadout(report,data,branch.config,origin) : undefined;
  const lines = [`# ${experiment.name} — ${branch.name}`, '', 'Data: synthetic demonstration dataset. AI-generated content is identified in the application.', `Snapshot: ${branch.snapshotId}`, `Period: ${experiment.start} – ${experiment.end}`, `Source: ${experiment.url}`, '', `## Objective`, branch.config.objective, '', `## Recommendation`, readout?.headline ?? 'Analysis in progress', ...(report && origin === 'demo' ? [recommendationTitle(report,data,branch.config)] : []), readout?.summary ?? ''];
  for (const section of organizeReport(data, branch.config, readout)) {
    lines.push('', `## ${section.title}`, section.description);
    if (section.metrics.length) {
      lines.push('', '| Metric | Role | Control | Treatment | Absolute change | Relative change | 95% CI (absolute) |', '| --- | --- | --- | --- | --- | --- | --- |');
      for (const m of section.metrics) {
        const relative = changeValues(m.control, m.treatment).relative;
        lines.push(`| ${m.name} | ${branch.config.roles[m.id]} | ${metricValue(m,m.control)} | ${metricValue(m,m.treatment)} | ${absoluteChange(m)} | ${relative === null ? 'N/A' : `${signed(relative)}%`} | ${m.ci?.map(v=>signed(v,3)).join(' to ')} ${m.unit === '%' ? 'pp' : m.unit} |`);
      }
      for (const m of section.metrics) lines.push('', `**${m.name}** — ${metricRule(m,branch.config)}. ${metricState(m,branch.config).label}. ${metricInterpretation(m,branch.config)} Evidence: metric:${m.id}`);
    }
    if (section.id === 'target') {
      const metric = section.metrics.find(metric => data.trends[metric.id]);
      if (metric) lines.push('', `### ${metric.name}, over time`, trendConclusion(metric.id,data), `Evidence: trend:${metric.id}`);
    }
    for (const finding of section.findings) lines.push('', `### ${finding.title}`, finding.body, ...(section.id === 'unexpected' ? [`Affected population: ${findingPopulation(finding,data)}`] : []), `Hypothesis: ${finding.hypothesis}`, `Validation: ${finding.validation}`, `Evidence: ${finding.evidenceIds.map(id=>`${id} (${evidenceById[id]?.title})`).join('; ')}`);
  }
  lines.push('', '## Limitations', ...(report?.limitations ?? []).map(x=>`- ${x}`), '', '## Action plan', ...branch.actions.map(a=>`- [${a.completed?'x':' '}] ${a.title} · ${a.priority} · ${a.owner || 'Unassigned'}\n  Success signal: ${a.successSignal || 'Not set'}\n  Validation: ${a.validation}`));
  return lines.join('\n');
}
