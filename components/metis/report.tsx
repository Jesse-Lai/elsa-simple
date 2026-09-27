'use client';
import { ArrowUpRight, Check, ChevronDown, GitBranch, Info, Plus, ShieldCheck, Sparkles, TrendingUp, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useExperimentData } from './experiment-data';
import { CaseStudyReport, CaseEvidenceView } from './case-study-report';
import { TrendChart } from './trend-chart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MetricChangeChart, MetricVisualCard } from './metric-visualizations';
import { comparisonInterval, experimentComparison, reportChartGroups, reportOverviewMetrics } from '@/lib/metis/report-chart-data';
import { absoluteChange, changeValues, metricInterpretation, metricRule, metricState, metricValue, number, signed } from '@/lib/metis/domain';
import type { ActionItem, AnalysisBranch, AnalysisConfig, Artifact, Finding, Metric } from '@/lib/metis/types';
import { findingReadout, recommendationTitle, reportReadout, trendConclusion } from '@/lib/metis/report-copy';
import { findingPopulation, organizeReport } from '@/lib/metis/report-sections';
import { ConclusionCard, ConclusionLabel, DecisionBadge, EvidenceChips, Eyebrow } from './common';

type ReportProps = { branch: AnalysisBranch; artifact?: Artifact; onEvidence:(id:string)=>void; onAsk:(text:string,ids:string[])=>void; onBranch:(title:string,context:string,ids:string[])=>void; onAction:(finding:Finding)=>void; onRun:()=>void };
export function ReportView({branch,artifact,onEvidence,onAsk,onBranch,onAction,onRun}:ReportProps){
  const data=useExperimentData();
  if(data.caseStudy)return <CaseStudyReport branch={branch} artifact={artifact} onEvidence={onEvidence} onAsk={onAsk} onBranch={onBranch} onAction={onAction}/>;
  const {experiment}=data;
  const report=artifact?.report;
  if(!report)return <Empty><EmptyHeader><EmptyTitle>{branch.name}</EmptyTitle><EmptyDescription>{branch.context||'Choose a question to analyze.'}</EmptyDescription></EmptyHeader><EmptyContent><EvidenceChips ids={branch.evidenceIds} onOpen={onEvidence}/><Button onClick={onRun}><Sparkles/>Analyze this branch</Button></EmptyContent></Empty>;
  const readout=reportReadout(report,data,branch.config,artifact?.origin);
  const sections=organizeReport(data,branch.config,report);
  const visible=data.metrics.filter(metric=>branch.config.roles[metric.id]!=='excluded');
  const overview=reportOverviewMetrics(data.metrics,branch.config);
  const findings=sections.flatMap(section=>section.findings);
  const recommendation=artifact?.origin==='demo'?recommendationTitle(report,data,branch.config):readout.summary;
  const breached=visible.some(metric=>branch.config.roles[metric.id]==='guardrail'&&metricState(metric,branch.config).tone==='caution');
  const pending=visible.some(metric=>['target','guardrail'].includes(branch.config.roles[metric.id])&&metricState(metric,branch.config).tone!=='positive');
  const decision=artifact?.origin==='demo'&&breached?'iterate':artifact?.origin==='demo'&&pending?'continue':report.recommendation;
  const status={ship:'Roll out gradually',iterate:'Keep rollout limited',continue:'Continue testing',stop:'Stop the experiment'}[decision];
  const hasTargetGain=visible.some(metric=>branch.config.roles[metric.id]==='target'&&(metric.treatment-metric.control)*(metric.direction==='up'?1:-1)>0);
  const conclusionTone=decision==='stop'?'negative':decision==='ship'&&!breached&&!pending?'positive':decision==='iterate'&&!hasTargetGain?'negative':'mixed';
  const decisionState=decision==='ship'?'passed':decision==='continue'?'observing':'warning';
  const findingCard=(finding:Finding,index:number,unexpected=false,expandHypothesis=false)=><FindingCard key={index} finding={finding} config={branch.config} prepared={artifact?.origin==='demo'} unexpected={unexpected} expandHypothesis={expandHypothesis} onEvidence={onEvidence} onAsk={onAsk} onBranch={onBranch} onAction={onAction} added={branch.actions.some(action=>action.title===finding.title)}/>;
  return <article className="metis-viz case-report min-w-0 space-y-6 p-5 md:p-8">
    <ConclusionCard tone={conclusionTone}>
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">{experiment.name} · {experiment.start}–{experiment.end}</p>
        <div className="space-y-1.5">
          <ConclusionLabel/>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight">{readout.headline}</h1>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">Goal: {branch.config.objective}</p>
        <div className="flex flex-wrap items-center gap-2"><DecisionBadge status={decisionState}>{status}</DecisionBadge><span className="text-xs text-muted-foreground">{number(experiment.controlN+experiment.treatmentN)} participants · Control vs. Treatment</span></div>
        {branch.parentId&&<p className="text-sm"><strong>Branch focus: </strong>{branch.context||branch.name}</p>}
      </header>
      <section className="case-overview space-y-4" aria-label="Key experiment changes">
        <div className="case-metric-grid" data-columns={overview.length}>{overview.map(metric=>{
          const comparison=experimentComparison(metric);
          return <MetricVisualCard key={metric.id} metric={comparison} onOpen={()=>onEvidence(`metric:${metric.id}`)} openLabel={`View ${metric.name} evidence`} status={metricState(metric,branch.config)}>
            <div className="space-y-1 text-xs leading-relaxed text-muted-foreground"><p className="tabular-nums">95% CI · {comparisonInterval(comparison)}</p><p>{metricRule(metric,branch.config)}</p></div>
          </MetricVisualCard>;
        })}</div>
        <p className="text-xs leading-relaxed text-muted-foreground">Bars start at zero; axis ranges vary by metric. Colors show observed direction; badges reflect the configured decision boundaries.</p>
      </section>
      <Card className="min-w-0"><CardHeader><CardTitle><h2>{artifact?.origin==='demo'?recommendation:'Recommendation'}</h2></CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed text-muted-foreground">{readout.summary}</p></CardContent><CardFooter><Button variant="link" className="h-auto whitespace-normal px-0 text-left" onClick={()=>onAsk('What evidence would change the rollout recommendation?',findings.flatMap(finding=>finding.evidenceIds))}>Explore the recommendation<ArrowUpRight/></Button></CardFooter></Card>
    </ConclusionCard>
    <Tabs key={`${branch.id}-${artifact.id}`} defaultValue="findings" className="min-w-0 gap-6">
      <div className="min-w-0 overflow-x-auto"><TabsList className="w-max"><TabsTrigger value="findings">Findings</TabsTrigger><TabsTrigger value="path">Analysis path</TabsTrigger><TabsTrigger value="hypotheses">Hypotheses & plans</TabsTrigger><TabsTrigger value="data">Data & sources</TabsTrigger></TabsList></div>
      <TabsContent value="findings" className="min-w-0 space-y-6">
        {sections.map(section=>{
          const targetTrends=section.id==='target'?section.metrics.filter(metric=>data.trends[metric.id]):[];
          return <section key={section.id} aria-labelledby={`report-${section.id}`} className="min-w-0 space-y-4">
            <Card className="min-w-0">
              <CardHeader><CardTitle><h2 id={`report-${section.id}`}>{section.title}</h2></CardTitle><CardDescription>{section.description}</CardDescription></CardHeader>
              {section.metrics.length>0&&<CardContent className="space-y-6">
                {reportChartGroups(section.metrics).map(group=><MetricChangeChart key={group.unit} rows={group.rows}/>)}
                <EvidenceChips ids={section.metrics.map(metric=>`metric:${metric.id}`)} onOpen={onEvidence}/>
              </CardContent>}
            </Card>
            {section.findings.map((finding,index)=>findingCard(finding,index,section.id==='unexpected'))}
            {targetTrends.map(metric=><Collapsible key={metric.id} className="min-w-0 rounded-xl border p-4">
              <CollapsibleTrigger asChild><Button variant="ghost" className="h-auto max-w-full whitespace-normal text-left">{metric.name}, over time<ChevronDown/></Button></CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-4"><p className="text-sm text-muted-foreground">{trendConclusion(metric.id,data)}</p><TrendChart metricId={metric.id} compact/><p className="text-xs text-muted-foreground">Illustrative daily trend · Decisions use the aggregate estimates above.</p><Button variant="ghost" size="sm" onClick={()=>onEvidence(`trend:${metric.id}`)}>Explore trend<ArrowUpRight/></Button></CollapsibleContent>
            </Collapsible>)}
          </section>;
        })}
      </TabsContent>
      <TabsContent value="path" className="min-w-0 space-y-5">
        <p className="text-sm leading-relaxed text-muted-foreground">Review the snapshot through four questions. These steps describe the analysis framework, not a chronological investigation.</p>
        <ol>{sections.map((section,index)=><li key={section.id} className="relative flex gap-4 pb-7 last:pb-0">
          <div className="relative flex w-7 shrink-0 justify-center">{index<sections.length-1&&<span aria-hidden className="absolute top-7 bottom-[-28px] w-px bg-chart-1/20"/>}<span className="relative flex size-7 items-center justify-center rounded-full bg-(--viz-primary-soft) text-xs font-semibold text-chart-1">{index+1}</span></div>
          <Card className="min-w-0 flex-1"><CardHeader><CardDescription>{section.title}</CardDescription><CardTitle><h2>{['Did the experiment achieve its intended outcome?','Did the gains come with an unacceptable cost?','How did overall product behavior change?','Which unplanned changes need validation?'][index]}</h2></CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-relaxed"><p>{section.description}</p>{section.metrics.map(metric=><p key={metric.id}><strong>{metric.name} · </strong>{metricRule(metric,branch.config)}. {metricInterpretation(metric,branch.config)}</p>)}</CardContent>{section.metrics.length>0&&<CardFooter><EvidenceChips ids={section.metrics.map(metric=>`metric:${metric.id}`)} onOpen={onEvidence}/></CardFooter>}</Card>
        </li>)}</ol>
      </TabsContent>
      <TabsContent value="hypotheses" className="min-w-0 space-y-6">
        <div className="space-y-2"><h2 className="text-lg font-semibold">Hypotheses to validate next</h2><p className="text-sm leading-relaxed text-muted-foreground">Connect each hypothesis to its evidence and next test. Add a finding to the action plan or explore it in a branch.</p></div>
        {findings.length?findings.map((finding,index)=>findingCard(finding,index,false,true)): <p className="text-sm text-muted-foreground">No hypotheses are available for the selected metrics.</p>}
      </TabsContent>
      <TabsContent value="data" className="min-w-0 space-y-6">
        <Card className="min-w-0"><CardHeader><CardTitle><h2>Experiment and data provenance</h2></CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-relaxed"><p>{experiment.name} · {experiment.start}–{experiment.end}</p><p>Control <strong>{number(experiment.controlN)}</strong> · Treatment <strong>{number(experiment.treatmentN)}</strong></p><p className="break-words text-muted-foreground">Snapshot: {experiment.snapshotId}</p><p className="text-muted-foreground">Synthetic demonstration data with precomputed aggregate estimates and confidence intervals. Daily trends are illustrative; retention uses matured cohorts.</p></CardContent></Card>
        <MetricTable branch={branch} items={visible} showRole onEvidence={onEvidence}/>
        <Card className="min-w-0"><CardHeader><CardTitle><h2>Metric definitions</h2></CardTitle></CardHeader><CardContent className="space-y-4">{visible.map(metric=><div key={metric.id} className="space-y-2 text-sm leading-relaxed"><p><strong>{metric.name} · </strong>{metric.description}</p><p className="text-muted-foreground">{metricInterpretation(metric,branch.config)}</p><EvidenceChips ids={data.evidence.filter(ref=>ref.metricId===metric.id).map(ref=>ref.id)} onOpen={onEvidence}/></div>)}</CardContent></Card>
      </TabsContent>
    </Tabs>
    <Collapsible><CollapsibleTrigger asChild><Button variant="ghost" className="h-auto max-w-full whitespace-normal text-left"><Info/>What this analysis can and can’t tell you<ChevronDown/></Button></CollapsibleTrigger><CollapsibleContent><ul className="list-disc space-y-2 pl-6 pt-3 text-sm leading-relaxed text-muted-foreground">{report.limitations.map((limitation,index)=><li key={index}>{limitation}</li>)}</ul></CollapsibleContent></Collapsible>
    <p className="text-xs text-muted-foreground">{experiment.name} · Synthetic demonstration data · Snapshot {experiment.end}</p>
  </article>;
}

function FindingCard({finding,config,prepared,unexpected,expandHypothesis=false,onEvidence,onAsk,onBranch,onAction,added}:{finding:Finding;config:AnalysisConfig;prepared:boolean;unexpected:boolean;expandHypothesis?:boolean;onEvidence:ReportProps['onEvidence'];onAsk:ReportProps['onAsk'];onBranch:ReportProps['onBranch'];onAction:ReportProps['onAction'];added:boolean}){
  const data=useExperimentData();
  const readout=prepared?findingReadout(finding,data,config):finding;
  const Icon=unexpected?Sparkles:finding.tone==='positive'?TrendingUp:ShieldCheck;
  return <Card><CardHeader><CardTitle className="flex items-start gap-2"><Icon className="size-4 shrink-0"/><h3>{readout.title}</h3></CardTitle><CardDescription>{readout.body}</CardDescription></CardHeader><CardContent className="space-y-3"><EvidenceChips ids={finding.evidenceIds} onOpen={onEvidence}/>{unexpected&&<p className="text-sm leading-relaxed text-muted-foreground"><strong>Affected population · </strong>{findingPopulation(finding,data)}</p>}<Collapsible defaultOpen={unexpected||expandHypothesis}><CollapsibleTrigger asChild><Button variant="ghost" size="sm">Hypothesis & validation<ChevronDown/></Button></CollapsibleTrigger><CollapsibleContent className="space-y-2 pt-3 text-sm leading-relaxed text-muted-foreground"><p><strong>Hypothesis · </strong>{finding.hypothesis}</p><p><strong>Validate with · </strong>{finding.validation}</p></CollapsibleContent></Collapsible></CardContent><CardFooter className="flex-wrap gap-2"><Button variant="outline" size="sm" onClick={()=>onBranch(finding.title,finding.validation,finding.evidenceIds)}><GitBranch/>Explore in a branch</Button><Button variant="outline" size="sm" onClick={()=>onAction(finding)}>{added?<Check/>:<Plus/>}{added?'Added to plan':'Add to plan'}</Button><Button variant="ghost" size="icon-sm" onClick={()=>onAsk(`Help me understand: ${finding.title}`,finding.evidenceIds)} aria-label={`Ask about ${finding.title}`}><ArrowUpRight/></Button></CardFooter></Card>;
}

export function MetricTable({branch,onEvidence,items,showRole=false}:{branch:AnalysisBranch;onEvidence:(id:string)=>void;items?:Metric[];showRole?:boolean}){
  const {metrics}=useExperimentData();
  const visible=(items??metrics).filter(m=>branch.config.roles[m.id]!=='excluded');
  return <div className="metis-viz viz-table"><Table><TableHeader><TableRow><TableHead>Metric</TableHead><TableHead>Control</TableHead><TableHead>Treatment</TableHead><TableHead>Change</TableHead><TableHead>95% CI</TableHead></TableRow></TableHeader><TableBody>{visible.map(m=>{
    const state=metricState(m,branch.config),relative=changeValues(m.control,m.treatment).relative;
    return <TableRow key={m.id}>
      <TableCell className="whitespace-normal"><div className="flex min-w-40 flex-col items-start gap-1 py-2"><Button variant="link" size="sm" className="h-auto max-w-56 p-0 text-left whitespace-normal" onClick={()=>onEvidence(`metric:${m.id}`)}>{m.name}<ArrowUpRight className="shrink-0"/></Button><p className="max-w-56 text-xs leading-relaxed text-muted-foreground">{showRole?`${branch.config.roles[m.id]} · `:''}{metricRule(m,branch.config)}</p></div></TableCell>
      <TableCell className="tabular-nums">{metricValue(m,m.control)}</TableCell><TableCell className="font-medium tabular-nums text-chart-1">{metricValue(m,m.treatment)}</TableCell>
      <TableCell className="tabular-nums"><p>{absoluteChange(m)}</p><p className="mt-1 text-xs text-muted-foreground">{relative===null?'N/A':`${signed(relative)}%`} relative</p></TableCell>
      <TableCell><p className="tabular-nums">[{m.ci?.map(v=>signed(v,3)).join(', ')}] {m.unit==='%'?'pp':m.unit}</p><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="viz-status mt-2 h-auto text-xs" data-tone={state.tone} aria-label={`${m.name}: ${state.label}. ${metricInterpretation(m,branch.config)}`}>{state.label}</Button></TooltipTrigger><TooltipContent className="max-w-64">{metricInterpretation(m,branch.config)}</TooltipContent></Tooltip></TableCell>
    </TableRow>;
  })}</TableBody></Table></div>;
}

export function EvidenceView({artifact,onAsk,onBranch}:{artifact:Artifact;onAsk:ReportProps['onAsk'];onBranch:ReportProps['onBranch']}){
  const {experiment,metricById,segments,caseStudy}=useExperimentData();
  if(caseStudy)return <CaseEvidenceView artifact={artifact}/>;
  const m=metricById[artifact.metricId];const isSegment=artifact.kind==='segments';
  return <article className="metis-viz min-w-0 space-y-6 bg-(--viz-surface) p-5 md:p-8">
    <div className="space-y-3"><Eyebrow>{isSegment?'A closer look':'Metric exploration'}</Eyebrow><h1 className="text-2xl font-semibold tracking-tight">{isSegment?`${m.name} by platform`:m.name}</h1><p className="text-muted-foreground">{m.description}</p></div>
    <div className="grid gap-3 sm:grid-cols-2">{[
      ['Control',metricValue(m,m.control)],['Treatment',metricValue(m,m.treatment)],['Absolute change',absoluteChange(m)],['95% confidence interval',`${m.ci?.map(v=>signed(v,3)).join(' to ')} ${m.unit==='%'?'pp':m.unit}`]
    ].map(([label,value])=><Card key={label} className="metis-viz viz-card viz-stat"><CardHeader className="gap-3"><CardDescription className="flex items-center gap-2">{(label==='Control'||label==='Treatment')&&<span aria-hidden="true" className={`size-2 rounded-full ${label==='Treatment'?'bg-chart-1':'bg-chart-2'}`}/>}<span>{label}</span></CardDescription><CardTitle>{value}</CardTitle></CardHeader></Card>)}</div>
    {isSegment?<>
      <div className="metis-viz viz-table"><Table><TableHeader><TableRow><TableHead>Platform</TableHead><TableHead>Users / arm</TableHead><TableHead>Control</TableHead><TableHead>Treatment</TableHead><TableHead>Change</TableHead></TableRow></TableHeader><TableBody>{segments.map(s=>{const values=s[artifact.metricId==='activation'?'activation':'latency'];return <TableRow key={s.id}><TableCell><div className="flex flex-col items-start gap-1">{s.name}{s.tone==='caution'&&<Badge variant="secondary" className="viz-status" data-tone="caution">Investigate</Badge>}</div></TableCell><TableCell>{number(s.n)}</TableCell><TableCell>{metricValue(m,values[0])}</TableCell><TableCell className="font-medium text-chart-1">{metricValue(m,values[1])}</TableCell><TableCell>{signed(values[1]-values[0])} {m.unit==='%'?'pp':'ms'}</TableCell></TableRow>})}</TableBody></Table></div>
      <Alert><TriangleAlert/><AlertDescription>These segment comparisons are exploratory. They identify where to look next; they do not establish why the change happened. Segment confidence intervals and interaction tests are not available.</AlertDescription></Alert>
    </>:<><Card className="metis-viz viz-card"><CardHeader><CardTitle><h2>{m.name}, over time</h2></CardTitle><CardDescription>Daily Control and Treatment performance</CardDescription></CardHeader><CardContent><TrendChart metricId={m.id}/></CardContent><CardFooter><p className="text-xs text-muted-foreground">{experiment.start}–{experiment.end} · Synthetic data</p></CardFooter></Card><p className="text-sm leading-relaxed text-muted-foreground">Intervals describe the treatment–control difference. Daily trends are illustrative and are not used to recompute the experiment-level estimates.</p></>}
    <div className="flex flex-wrap gap-2"><Button onClick={()=>onAsk(`Explain the ${m.name} ${isSegment?'platform breakdown':'result'}, its uncertainty, and what we should do next.`,artifact.evidenceIds)}><Sparkles/>Ask ELSA about this</Button><Button variant="outline" onClick={()=>onBranch(isSegment?'Platform investigation':`${m.name} follow-up`,`Investigate ${m.name} and identify the next validation step.`,artifact.evidenceIds)}><GitBranch/>Explore in a branch</Button></div>
    <Collapsible><CollapsibleTrigger asChild><Button variant="ghost" size="sm">Source details<ChevronDown/></Button></CollapsibleTrigger><CollapsibleContent className="space-y-2 pt-3 text-xs break-words text-muted-foreground"><p>{experiment.snapshotId}</p><p>{artifact.evidenceIds.join(' · ')}</p><p>Precomputed demo evidence · No external experiment data</p></CollapsibleContent></Collapsible>
  </article>;
}

export function ActionPlan({branch,onChange,onEvidence}:{branch:AnalysisBranch;onChange:(action:ActionItem)=>void;onEvidence:(id:string)=>void}){
  return <section className="space-y-4 p-5 md:p-8"><h2 className="text-lg font-semibold">Action plan</h2><p className="text-sm text-muted-foreground">{branch.actions.filter(a=>a.completed).length} of {branch.actions.length} actions complete</p>
    {branch.actions.map(action=><Card key={action.id}><CardHeader><div className="flex items-start gap-3"><Checkbox id={`action-${action.id}`} checked={action.completed} onCheckedChange={checked=>onChange({...action,completed:checked===true})} aria-label={`Complete ${action.title}`}/><Label htmlFor={`action-${action.id}`} className={action.completed?'line-through':''}>{action.title}</Label></div><CardDescription>{action.validation}</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-relaxed text-muted-foreground"><strong>Hypothesis · </strong>{action.hypothesis}</p><EvidenceChips ids={action.evidenceIds} onOpen={onEvidence}/>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor={`priority-${action.id}`}>Priority</Label><NativeSelect id={`priority-${action.id}`} value={action.priority} onChange={e=>onChange({...action,priority:e.target.value as ActionItem['priority']})}>{['High','Medium','Low'].map(x=><NativeSelectOption key={x} value={x}>{x}</NativeSelectOption>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor={`owner-${action.id}`}>Owner</Label><Input id={`owner-${action.id}`} placeholder="Unassigned" value={action.owner} onChange={e=>onChange({...action,owner:e.target.value})}/></div></div>
      <div className="space-y-2"><Label htmlFor={`signal-${action.id}`}>Success signal</Label><Textarea id={`signal-${action.id}`} placeholder="What would tell us this worked?" value={action.successSignal} onChange={e=>onChange({...action,successSignal:e.target.value})}/></div>
    </CardContent></Card>)}
  </section>;
}
