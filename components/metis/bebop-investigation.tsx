'use client';

import type { ReactNode } from 'react';
import { ArrowDown, Check, ChevronDown, Plus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { bebopContext, investigationMetric } from '@/lib/metis/bebop-investigation';
import { caseDelta, caseValue, planFinding, sourceEvidence } from '@/lib/metis/case-study';
import { signed } from '@/lib/metis/metric-analysis';
import type { CaseStudy } from '@/lib/metis/case-study-types';
import type { AnalysisBranch, Finding, Report } from '@/lib/metis/types';
import { EvidenceChips } from './common';
import { CaseCancellationChart, CaseDeltaChart, CaseFeedbackMatrix } from './case-visualizations';

type Props = {
  data: CaseStudy;
  branch: AnalysisBranch;
  report?: Report;
  onEvidence: (id: string) => void;
  onAsk: (text: string, ids: string[]) => void;
  onBranch: (title: string, context: string, ids: string[]) => void;
  onAction: (finding: Finding) => void;
};

function Stage({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <section className="min-w-0 space-y-4" aria-label={`Stage ${number}: ${title}`}>
    <div className="flex items-start gap-3">
      <Badge variant="outline" className="h-7 min-w-7 shrink-0 justify-center border-muted-foreground/60 tabular-nums">{number}</Badge>
      <h2 className="min-w-0 flex-1 text-lg leading-7 font-semibold tracking-tight">{title}</h2>
    </div>
    {children}
  </section>;
}

function Takeaway({ title, children }: { title: string; children: ReactNode }) {
  return <Alert role="note">
    <AlertTitle className="line-clamp-none">{title}</AlertTitle><AlertDescription><p>{children}</p></AlertDescription>
  </Alert>;
}

export function BebopInvestigation({ data, branch, report, onEvidence, onAction }: Props) {
  const metric = (id: string) => investigationMetric(data.metrics.find(m => m.id === id)!);
  const sources = (ids: string[]) => <EvidenceChips ids={sourceEvidence(ids)} onOpen={onEvidence}/>;
  const planButton = (id: string) => {
    const plan = data.plans.find(p => p.id === id)!;
    const added = branch.actions.some(action => action.title === plan.title);
    return <Button key={id} variant="outline" size="sm" className="h-auto max-w-full whitespace-normal py-2 text-left" disabled={added} onClick={() => onAction(planFinding(plan))}>
      {added ? <Check/> : <Plus/>}{added ? `Added · ${plan.title}` : plan.title}
    </Button>;
  };
  const hypothesisSections = [
    { id: 'H3', label: 'Waiting and input continuity', plans: ['thinking', 'queued'] },
    { id: 'H2' },
    { id: 'H4' },
  ];

  return <div className="min-w-0 space-y-9">
    <Stage number="01" title="ZQ clicks rise while DAU falls; compare activity and quality metrics">
      <Card className="min-w-0">
        <CardHeader><CardTitle><h3>ZQ clicks rise; active usage and inferred SAT decline</h3></CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <CaseDeltaChart rows={['message-dau', 'early-sat', 'zq-engagement', 'stop-generating', 'non-zq-cancel'].map(metric)} showNote={false}/>
          {sources(['P2', 'S08', 'P3-image'])}
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader><CardTitle><h3>Feedback and return behavior add context</h3></CardTitle><CardDescription>Explicit thumbs-down does not show a clear change.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <CaseFeedbackMatrix rows={['early-dsat', 'early-thumbs-down'].map(metric)} onEvidence={onEvidence}/>
          <div className="grid gap-5 border-t pt-5 sm:grid-cols-2">
            <div className="space-y-2"><h4 className="text-sm font-medium">2-day engagement</h4><p className="case-signal flex items-center gap-1.5 text-xl font-semibold" data-tone="negative"><ArrowDown className="size-5"/>Down <span className="text-xs font-normal text-muted-foreground">Reported in discussion</span></p><p className="text-xs leading-relaxed text-muted-foreground">{bebopContext.twoDayEngagement.note}</p></div>
            <div className="space-y-2"><h4 className="text-sm font-medium">Sessions per user</h4><p className="case-signal text-xl font-semibold tabular-nums" data-tone="negative">{caseDelta(metric('sessions-per-user'))}</p><p className="text-sm tabular-nums text-muted-foreground">{caseValue(metric('sessions-per-user'), metric('sessions-per-user').control)} → {caseValue(metric('sessions-per-user'), metric('sessions-per-user').treatment)}</p><p className="text-xs text-muted-foreground">Mar 31–Apr 12 · PPT summary</p></div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">Thumbs-down: 0.12% → 0.11%, p = 0.5723. The displayed values imply −8.33% relative; the source reports −10.17% before rounding. This does not establish improvement or unchanged satisfaction.</p>
          {sources(['S08', 'S04', 'S02'])}
          <Collapsible>
            <CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="group max-w-full whitespace-normal">More entry, retention and reliability metrics<ChevronDown className="transition-transform group-data-[state=open]:rotate-180"/></Button></CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-5">
              <CaseDeltaChart rows={['active-sessions', 'query-submit', 'new-conversations', 'prompting'].map(metric)}/>
              <CaseDeltaChart rows={['chat-retained', 'app-reliability'].map(metric)}/>
              <p className="text-sm leading-relaxed"><strong>UPLT P95: 1.7 s → 1.7 s.</strong> The displayed aggregate is unchanged; scenario-specific or perceived waiting is still possible.</p>
              <CaseFeedbackMatrix rows={[metric('early-thumbs')]} onEvidence={onEvidence}/>
              <p className="text-xs leading-relaxed text-muted-foreground">Entry scorecard: Mar 31–Apr 11, with a PassiveMetrics data warning. The retention, reliability and latency summary has no visible window. No recovery result is supplied.</p>
              {sources(['P2-image', 'S07'])}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
      <Takeaway title="Stage 1 · Stop generation rises while active usage falls">
        Message DAU falls 0.47 pp and stop generation rises 0.49 pp. The discussion identifies stop generation as the main driver of inferred DSAT; whether it causes lower active usage remains unverified.
      </Takeaway>
    </Stage>

    <Stage number="02" title="Stop generation rises; isolate ZQ, Non-ZQ and Web/Work patterns">
      <Card className="min-w-0">
        <CardHeader><CardTitle><h3>Cancellation rises in both ZQ and Non-ZQ</h3></CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <CaseCancellationChart rows={data.metrics.filter(m => m.group === 'cancel')}/>
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader><CardTitle><h3>Web/Work removal affects Premium; the click-rate test is still missing</h3></CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-[1fr_1.4fr]">
            <div className="space-y-2"><p className="text-3xl font-semibold tracking-tight">≈{bebopContext.toggleUsage.percent}% <span className="text-sm font-normal text-muted-foreground">of sessions</span></p><p className="text-sm">Previously used Web/Work switching</p><p className="text-xs leading-relaxed text-muted-foreground">{bebopContext.toggleUsage.note}</p></div>
            <div className="space-y-3 text-sm leading-relaxed"><p><Badge variant="secondary" className="mr-2">Premium</Badge>Affected by removal</p><p><Badge variant="outline" className="mr-2">Starter</Badge>Not affected by the same removal</p><p className="text-xs text-muted-foreground">No treatment/control toggle impressions, clicks or click-through rates were supplied. Starter is not an equivalent randomized control for Premium.</p></div>
          </div>
          <Table aria-label="Observed Web and Work query shares">
            <TableHeader><TableRow><TableHead>Query mix</TableHead><TableHead>{bebopContext.queryMix.controlLabel}</TableHead><TableHead>{bebopContext.queryMix.treatmentLabel}</TableHead><TableHead>Difference</TableHead></TableRow></TableHeader>
            <TableBody>{bebopContext.queryMix.rows.map(row => <TableRow key={row.name}><TableCell className="font-medium">{row.name}</TableCell><TableCell className="tabular-nums">{row.control}%</TableCell><TableCell className="tabular-nums">{row.treatment}%</TableCell><TableCell className="tabular-nums">{signed(row.treatment - row.control)} pp</TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <Takeaway title="Stage 2 · More ZQ engagement, but Non-ZQ remains unexplained">
        ZQ clicks rise from 2.33% to 6.27%, while user cancellation rises in both slices. Higher entry engagement does not establish sustained value. Neither ZQ nor the Web/Work evidence currently explains the Non-ZQ increase.
      </Takeaway>
    </Stage>

    <Stage number="03" title="Non-ZQ cancellation remains unexplained; evaluate hypotheses and plan tests">
      {hypothesisSections.map(section => {
        const hypothesis = data.hypotheses.find(h => h.id === section.id)!;
        return <Card className="min-w-0" key={section.id}>
          <CardHeader>{section.label&&<CardDescription>{section.label} · {hypothesis.status}</CardDescription>}<CardTitle><h3>{hypothesis.title}</h3></CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <dl className="space-y-4">
              <div><dt className="mb-1 font-medium">Existing evidence</dt><dd className="text-muted-foreground">{hypothesis.support}</dd></div>
              <div><dt className="mb-1 font-medium">What is missing or challenges it</dt><dd className="text-muted-foreground">{hypothesis.counter}</dd></div>
              <div><dt className="mb-1 font-medium">Next experiment</dt><dd>{hypothesis.validation}</dd></div>
            </dl>
            {sources(hypothesis.sourceIds)}
          </CardContent>
          {section.plans&&<CardFooter className="flex flex-col items-start gap-3 border-t pt-5">
            <p className="text-xs text-muted-foreground">Original proposals · no follow-up results supplied · Add to action plan</p>
            <div className="flex flex-wrap gap-2">{section.plans.map(planButton)}</div>
          </CardFooter>}
        </Card>;
      })}
      <Card className="min-w-0">
        <CardHeader><CardTitle><h3>Measurement checks and other explanations</h3></CardTitle><CardDescription>Resolve the metric warnings before treating a mechanism or an intervention as validated.</CardDescription></CardHeader>
        <CardContent>
          <Accordion type="multiple">
            {['H7', 'H1', 'H5', 'H6'].map(id => {
              const h = data.hypotheses.find(hypothesis => hypothesis.id === id)!;
              return <AccordionItem key={id} value={id}><AccordionTrigger>{h.title}</AccordionTrigger><AccordionContent className="space-y-3 leading-relaxed"><p>{h.support}</p><p className="text-muted-foreground">{h.counter}</p><p><strong>Next check · </strong>{h.validation}</p>{sources(h.sourceIds)}</AccordionContent></AccordionItem>;
            })}
            <AccordionItem value="composer"><AccordionTrigger>Additional proposal: prompt line vs prompt box</AccordionTrigger><AccordionContent className="space-y-3 leading-relaxed"><p>{data.plans.find(plan => plan.id === 'composer')!.hypothesis}</p><p className="text-muted-foreground">{data.plans.find(plan => plan.id === 'composer')!.validation}</p>{sources(['P5', 'S05'])}{planButton('composer')}</AccordionContent></AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter>{planButton('data-audit')}</CardFooter>
      </Card>
      <Takeaway title="Stage 3 · Keep the experiment at 5%; validate the mechanism before expanding">
        Prioritize the measurement audit, then isolate Thinking feedback, queued prompts, ZQ content and Web/Work switching. Track successful completion and mature return alongside user cancellation; a lower stop rate alone is not a validated improvement.
      </Takeaway>
    </Stage>
    {report && <Card className="min-w-0"><CardHeader><CardTitle>Current AI analysis</CardTitle><CardDescription>Additional interpretation of the supplied evidence</CardDescription></CardHeader><CardContent className="space-y-5">{report.findings.map((finding, index) => <section key={index} className="space-y-2"><h3 className="font-medium">{finding.title}</h3><p className="text-sm leading-relaxed">{finding.body}</p><EvidenceChips ids={finding.evidenceIds} onOpen={onEvidence}/></section>)}</CardContent></Card>}
  </div>;
}
