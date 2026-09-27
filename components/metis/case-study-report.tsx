'use client';

import { ChartColumn, Workflow } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PromptSuggestion } from '@/components/prompt-kit/prompt-suggestion';
import { useExperimentData } from './experiment-data';
import { AnalysisPath } from './analysis-path';
import { BebopInvestigation } from './bebop-investigation';
import { CaseMetricVisual } from './case-metric-visual';
import { ConclusionCard, ConclusionLabel } from './common';
import { CaseDeltaChart, CaseCancellationChart } from './case-visualizations';
import { caseDelta, caseRelative, caseValue, sourceEvidence } from '@/lib/metis/case-study';
import { investigationMetric } from '@/lib/metis/bebop-investigation';
import type { CaseMetric } from '@/lib/metis/case-study-types';
import type { AnalysisBranch, Artifact, Finding } from '@/lib/metis/types';

type Props={branch:AnalysisBranch;artifact?:Artifact;onEvidence:(id:string)=>void;onAsk:(text:string,ids:string[])=>void;onBranch:(title:string,context:string,ids:string[])=>void;onAction:(finding:Finding)=>void};
const cardClass='min-w-0';
const viewTabClass='h-full min-h-14 min-w-0 justify-start gap-3 rounded-xl border-border bg-card px-4 py-3 text-base text-muted-foreground whitespace-normal data-[state=inactive]:hover:bg-muted/50 data-[state=active]:border-foreground/30 data-[state=active]:bg-muted/40 data-[state=active]:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none';

export function CaseComparisonChart({rows,cancel=false}:{rows:CaseMetric[];cancel?:boolean}){
  return cancel?<CaseCancellationChart rows={rows}/>:<CaseDeltaChart rows={rows}/>;
}

export function CaseStudyReport({branch,artifact,onEvidence,onAsk,onBranch,onAction}:Props){
  const {caseStudy:data}=useExperimentData();
  if(!data)return null;
  const report=artifact?.report;
  const metric=(id:string)=>data.metrics.find(m=>m.id===id)!;
  const overviewMetrics=['message-dau','early-sat','zq-engagement','stop-generating'].map(id=>investigationMetric(metric(id)));
  return <article className="metis-viz case-report min-w-0 space-y-6 p-5 md:p-8">
    <ConclusionCard tone={artifact?.origin==='ai'&&report?.recommendation==='stop'?'negative':'mixed'}>
      <header className="space-y-3">
        <div className="space-y-1.5">
          <ConclusionLabel/>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight">{artifact?.origin==='ai' ? report?.headline??data.headline : data.headline}</h1>
        </div>
        {branch.parentId&&<p className="text-sm"><strong>Branch focus: </strong>{branch.context||branch.name}</p>}
      </header>
      <section className="case-overview space-y-4" aria-label="Key experiment changes">
        <div className="case-metric-grid" data-columns="4">{overviewMetrics.map(m=><CaseMetricVisual key={m.id} metric={m} onEvidence={onEvidence} compact/>)}</div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested questions">
          <PromptSuggestion size="sm" className="h-auto max-w-full whitespace-normal py-2 text-left" onClick={()=>onAsk('Why should Bebop stay at 5% instead of expanding?',['source:P1','source:P2','source:S07'])}>Why hold at 5%?</PromptSuggestion>
          <PromptSuggestion size="sm" className="h-auto max-w-full whitespace-normal py-2 text-left" onClick={()=>onAsk('Why is cancellation rising in both ZQ and non-ZQ, and what remains unknown?',['segment:crashes','source:S05'])}>Why is cancellation rising?</PromptSuggestion>
          <PromptSuggestion size="sm" className="h-auto max-w-full whitespace-normal py-2 text-left" onClick={()=>onAsk('What should we validate next before expanding Bebop?',sourceEvidence(data.plans.flatMap(plan=>plan.sourceIds)))}>What should we validate next?</PromptSuggestion>
        </div>
      </section>
    </ConclusionCard>
    <Tabs defaultValue="findings" className="min-w-0 gap-6">
      <TabsList aria-label="Analysis views" className="grid w-full grid-cols-2 gap-3 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto">
        <TabsTrigger value="findings" className={viewTabClass}><ChartColumn className="size-5" aria-hidden/>Findings</TabsTrigger>
        <TabsTrigger value="path" className={viewTabClass}><Workflow className="size-5" aria-hidden/>Analysis path</TabsTrigger>
      </TabsList>
      <TabsContent value="findings" className="min-w-0">
        <BebopInvestigation data={data} branch={branch} report={artifact?.origin==='ai'?report:undefined} onEvidence={onEvidence} onAsk={onAsk} onBranch={onBranch} onAction={onAction}/>
      </TabsContent>
      <TabsContent value="path" className="min-w-0"><AnalysisPath/></TabsContent>
    </Tabs>
  </article>;
}

export function CaseEvidenceView({artifact}:{artifact:Artifact}){
  const {caseStudy:data}=useExperimentData();if(!data)return null;
  const cancel=artifact.evidenceIds.includes('segment:crashes');
  const rows=cancel?data.metrics.filter(m=>m.group==='cancel'):data.metrics.filter(m=>['active-sessions','query-submit','zq-engagement'].includes(m.id));
  return <article className="metis-viz space-y-5 p-5 md:p-8"><Card className={cardClass}><CardHeader><CardTitle><h1>{cancel?'Both cancellation slices regress':'Bebop entry metrics'}</h1></CardTitle><CardDescription>Source-reported observations · no confidence intervals supplied</CardDescription></CardHeader><CardContent><CaseComparisonChart rows={rows} cancel={cancel}/></CardContent><CardFooter><p className="text-xs leading-relaxed text-muted-foreground">{cancel?'Non-Bebop / Bebop behavior slices; missing denominators prevent causal contribution analysis.':'Metric-specific windows; these values are not a time series or funnel.'}</p></CardFooter></Card>{rows.map(m=><p key={m.id} className="text-sm leading-relaxed"><strong>{m.name}: </strong>{caseValue(m,m.control)} → {caseValue(m,m.treatment)} ({caseDelta(m)} / {caseRelative(m)}). {m.note}</p>)}</article>;
}
