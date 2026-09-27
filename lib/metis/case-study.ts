import type { ActionItem, AnalysisBranch, Report } from './types';
import type { CaseMetric, CasePlan, CaseStudy } from './case-study-types';
import { changeValues, number, signed } from './metric-analysis';

export const caseValue = (m: CaseMetric, value: number) => `${number(value, m.unit==='ratio'?4:3)}${m.unit==='%'?'%':m.unit==='s'?' s':m.unit==='/user'?' /user':''}`;
export const caseDelta = (m: CaseMetric) => `${signed(m.treatment-m.control, m.unit==='ratio'?4:3)} ${m.unit==='%'?'pp':m.unit==='ratio'?'ratio':m.unit}`;
export const caseRelative = (m: CaseMetric) => { const relative=changeValues(m.control,m.treatment).relative;return relative===null?'Undefined':`${signed(relative)}%`; };
// Direction describes the observed change, not statistical significance or causality.
export function caseSignal(m: CaseMetric): {tone:'positive'|'negative'|'neutral';label:string} {
  if(['early-thumbs','early-thumbs-down'].includes(m.id))return {tone:'neutral',label:'Inconclusive'};
  if(m.control===m.treatment)return {tone:'neutral',label:'No observed change'};
  const lowerIsBetter=['stop-generating','early-dsat','zq-cancel','non-zq-cancel','uplt'].includes(m.id);
  const favorable=lowerIsBetter?m.treatment<m.control:m.treatment>m.control;
  return {tone:favorable?'positive':'negative',label:favorable?'Favorable direction':'Adverse direction'};
}
export const sourceEvidence = (ids:string[]) => ids.map(id=>`source:${id}`);
export const caseSourceUrl = (file:string) => `/cases/bebop/${encodeURIComponent(file)}`;
export const planFinding = (plan:CasePlan) => ({title:plan.title,body:plan.origin,hypothesis:plan.hypothesis,validation:plan.validation,evidenceIds:sourceEvidence(plan.sourceIds),tone:'neutral' as const});

export function exportCaseStudy(data:CaseStudy,branch:AnalysisBranch,report?:Report) {
  const lines=[`# ${data.title} — ${branch.name}`,'',`Snapshot: ${branch.snapshotId}`,`Source: ${data.sourceLabel}`,'Data provenance: source-reported observations transcribed from supplied materials. No raw event data was supplied.','',`## Experiment objective`,data.objective,`Treatment: ${data.treatmentId}; Control: ${data.controlId}.`,data.sampleNote,'','## Conclusion',report?.headline??data.headline,report?.summary??data.summary,'','Documented recommendation: Hold at 5%. Do not expand. This is not a final approval or evidence of a validated fix.','','## Source measurements','Absolute and calculated relative changes use displayed source values. Reported relative deltas remain separate. No confidence intervals are supplied.','','| Metric | Control / Non-Bebop | Treatment / Bebop | Absolute change | Calculated relative | Source-reported relative | Window | Evidence |','| --- | --- | --- | --- | --- | --- | --- | --- |'];
  data.metrics.forEach(m=>lines.push(`| ${m.name} | ${caseValue(m,m.control)} | ${caseValue(m,m.treatment)} | ${caseDelta(m)} | ${caseRelative(m)} | ${m.reportedRelative===undefined?'Not supplied':`${signed(m.reportedRelative)}%`} | ${m.window} | ${sourceEvidence(m.sourceIds).join(', ')} |`));
  data.metrics.forEach(m=>lines.push('',`**${m.name} (${m.id})**: ${m.note}${m.pValue?` Source p-value: ${m.pValue}.`:''}`));
  lines.push('','## Investigation path');
  data.steps.forEach(s=>lines.push('',`### ${s.date}: ${s.question}`,`Action: ${s.action}`,`Result: ${s.result}`,`Status: ${s.status}`,`Evidence: ${sourceEvidence(s.sourceIds).join(', ')}`));
  lines.push('','## Hypotheses');
  data.hypotheses.forEach(h=>lines.push('',`### ${h.id}: ${h.title}`,`Status: ${h.status}`,`Support: ${h.support}`,`Counterevidence / limits: ${h.counter}`,`Validation: ${h.validation}`,`Evidence: ${sourceEvidence(h.sourceIds).join(', ')}`));
  lines.push('','## Next steps — no follow-up outcomes supplied');
  data.plans.forEach(p=>lines.push('',`### ${p.title} (${p.origin})`,`Hypothesis: ${p.hypothesis}`,`Validation: ${p.validation}`,`Evidence: ${sourceEvidence(p.sourceIds).join(', ')}`));
  if(report){lines.push('','## Current analysis');report.findings.forEach(f=>lines.push('',`### ${f.title}`,f.body,`Hypothesis: ${f.hypothesis}`,`Validation: ${f.validation}`,`Evidence: ${f.evidenceIds.join(', ')}`));}
  lines.push('','## Action plan',...branch.actions.map((a:ActionItem)=>`- [${a.completed?'x':' '}] ${a.title} · ${a.priority} · ${a.owner||'Unassigned'}\n  Success signal: ${a.successSignal||'Not set'}\n  Validation: ${a.validation}`),'','## Limitations',...data.limitations.map(l=>`- ${l}`),'','## Sources');
  data.sources.forEach(s=>lines.push(`- source:${s.id} — [${s.title}](https://metis-experiment-intelligence.jesselai.chatgpt.site${caseSourceUrl(s.file)}). ${s.detail}`));
  return lines.join('\n');
}
