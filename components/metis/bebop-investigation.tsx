'use client';

import { type ReactNode } from 'react';
import { ArrowRight, BookOpen, Check, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MetricBreakdownPanel } from './metric-breakdown-panel';
import { bebopContext, investigationMetric } from '@/lib/metis/bebop-investigation';
import { planFinding } from '@/lib/metis/case-study';
import type { CaseStudy } from '@/lib/metis/case-study-types';
import type { AnalysisBranch, Finding, Report } from '@/lib/metis/types';
import { EvidenceChips } from './common';
import { GroupLegend, HorizontalMetricPair, PairBars } from './bebop-comparison-chart';
import styles from './bebop-investigation.module.css';

type Props = {
  data: CaseStudy; branch: AnalysisBranch; report?: Report;
  onEvidence: (id: string) => void;
  onAsk: (text: string, ids: string[]) => void;
  onBranch: (title: string, context: string, ids: string[]) => void;
  onAction: (finding: Finding) => void;
};

function Section({ title, sources, children }: { title: string; sources?: ReactNode; children: ReactNode }) {
  return <section className={styles.section} aria-label={title}>
    <header className={styles.sectionHeading}><h2>{title}</h2>{sources}</header>
    {children}
  </section>;
}

export function BebopInvestigation({ data, branch, report, onEvidence, onAction }: Props) {
  const metric = (id: string) => investigationMetric(data.metrics.find(m => m.id === id)!);
  const sources = (ids: string[], section: string) => <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" aria-label={`${section} sources`}><BookOpen className="size-3.5"/>Sources<ChevronDown className="size-3"/></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="max-w-80">{ids.map(id => <DropdownMenuItem key={id} className="text-xs" onSelect={() => onEvidence(`source:${id}`)}>{data.sources.find(s => s.id === id)!.title}</DropdownMenuItem>)}</DropdownMenuContent>
  </DropdownMenu>;
  const planButton = (id: string, label: string) => {
    const plan = data.plans.find(p => p.id === id)!;
    const added = branch.actions.some(action => action.title === plan.title);
    return <Button variant="outline" size="sm" className="h-auto max-w-full whitespace-normal py-1.5 text-xs" disabled={added} onClick={() => onAction(planFinding(plan))}>{added ? <Check className="size-3.5"/> : <Plus className="size-3.5"/>}{added ? 'Added' : label}</Button>;
  };
  const confirmedFindings = [
    'Message DAU −0.47 pp; sessions per user also decline.',
    'Inferred SAT −4.34 pp; cancellations rise in both entry paths.',
  ];
  const chains = [
    { id: 'sustained-use', finding: 'The cause of lower sustained use is unresolved.', hypotheses: [
      { text: 'ZQ may encourage trials without repeat use.', action: 'Test ZQ variants; track completion and return.', plan: 'zq', button: 'Add ZQ test' },
      { text: 'Removing Web/Work switching may disrupt some tasks.', action: 'Test restoring the switch within Premium.', plan: 'web-work', button: 'Add switch test' },
    ] },
    { id: 'cancellation', finding: 'The cause of higher cancellation is unresolved.', hypotheses: [
      { text: 'Limited progress feedback may lead users to cancel.', action: 'Test Thinking feedback; measure completion.', plan: 'thinking', button: 'Add feedback test' },
      { text: 'Users may cancel to submit the next request.', action: 'Test queued prompts; track cancellation and completion.', plan: 'queued', button: 'Add queued-prompt test' },
    ] },
    { id: 'measurement', finding: 'Sample ratio and data-quality warnings need review.', hypotheses: [
      { text: 'Measurement or population differences may distort results.', action: 'Audit allocation, metric definitions and comparison windows.', plan: 'data-audit', button: 'Add measurement audit' },
    ] },
  ];

  return <div className={styles.report}>
    <Section title="Experiment checks" sources={sources(['S08', 'P2', 'P2-image', 'S06'], 'Experiment checks')}>
      <Card className={styles.card}>
        <div className={styles.cardTop}><GroupLegend/></div>
        <div className={styles.checkGrid}>
          <div className={styles.checkMetric}><h3>Users per group</h3><PairBars title="Users per group" control={bebopContext.sampleBalance.control} treatment={bebopContext.sampleBalance.treatment} unit="users" max={50000}/></div>
          {['message-dau', 'early-sat', 'zq-engagement'].map(id => {
            const m = metric(id);
            return <div key={id} className={styles.checkMetric}><h3>{m.name}</h3><PairBars title={m.name} control={m.control} treatment={m.treatment} unit={m.unit}/></div>;
          })}
        </div>
      </Card>
    </Section>

    <Section title="Metric comparison">
      <Card className={styles.card}>
        <div className={styles.cardTop}><GroupLegend/></div>
        <div className={styles.metricRows}>{['message-dau', 'early-sat', 'zq-engagement', 'stop-generating', 'chat-retained'].map(id => <HorizontalMetricPair key={id} metric={metric(id)} onOpen={() => onEvidence(`case-metric:${id}`)}/>)}</div>
      </Card>
    </Section>

    <Section title="Detailed analysis">
      <MetricBreakdownPanel/>
    </Section>

    <Section title="Findings & next steps">
      <Card className={styles.card}>
        <div className={styles.connections}>
          <div className={styles.confirmedFindings} aria-label="Confirmed findings">
            {confirmedFindings.map(finding => <div key={finding} className={`${styles.node} ${styles.observation}`} data-status="observed">{finding}</div>)}
          </div>
          <div className={styles.connectionHead} aria-hidden><span>Key finding</span><span>Unverified hypothesis</span><span>Next action</span></div>
          {chains.map(chain => <div key={chain.id} className={styles.chain} data-finding-chain={chain.id}>
            <div className={`${styles.node} ${styles.observation}`} data-status="pending" aria-label="Key finding"><span className={styles.mobileLabel}>Key finding</span>{chain.finding}</div>
            <div className={styles.forkLine} aria-hidden/>
            <div className={styles.branches}>
              {chain.hypotheses.map(hypothesis => <div key={hypothesis.plan} className={styles.hypothesisBranch} data-hypothesis={hypothesis.plan}>
                <div className={styles.branchLead} aria-hidden><ArrowRight strokeWidth={1}/></div>
                <div className={`${styles.node} ${styles.hypothesis}`} aria-label="Unverified hypothesis"><span className={styles.mobileLabel}>Unverified hypothesis</span>{hypothesis.text}</div>
                <div className={styles.connector} aria-hidden><ArrowRight strokeWidth={1}/></div>
                <div className={`${styles.node} ${styles.action}`} aria-label="Next action"><div><span className={styles.mobileLabel}>Next action</span>{hypothesis.action}</div>{planButton(hypothesis.plan, hypothesis.button)}</div>
              </div>)}
            </div>
          </div>)}
        </div>
      </Card>
      {report && <Collapsible><CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="group">Current AI analysis<ChevronDown className="transition-transform group-data-[state=open]:rotate-180"/></Button></CollapsibleTrigger><CollapsibleContent className="space-y-5 pt-4">{report.findings.map((finding, index) => <section key={index} className="space-y-2"><h3 className="text-sm font-medium">{finding.title}</h3><p className="text-sm leading-relaxed">{finding.body}</p><EvidenceChips ids={finding.evidenceIds} onOpen={onEvidence}/></section>)}</CollapsibleContent></Collapsible>}
    </Section>
  </div>;
}
