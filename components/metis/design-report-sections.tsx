'use client';

import { useState, type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptSuggestion } from '@/components/prompt-kit/prompt-suggestion';
import { planFinding } from '@/lib/metis/case-study';
import { bebopContext, investigationMetric } from '@/lib/metis/bebop-investigation';
import type { CaseStudy } from '@/lib/metis/case-study-types';
import type { AnalysisBranch, Finding } from '@/lib/metis/types';
import { MetricBreakdownPanel } from './metric-breakdown-panel';
import { DesignVector } from './design-vector';
import styles from './design-report-sections.module.css';

export type DesignReportProps = {
  onAsk: (text: string, ids: string[]) => void;
  onEvidence: (id: string) => void;
  onAction: (finding: Finding) => void;
  branch: AnalysisBranch;
  data: CaseStudy;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className={styles.section} aria-label={title}><h2>{title}</h2>{children}</section>;
}

function Legend({ difference = false }: { difference?: boolean }) {
  return <div className={styles.legend}><span><i style={{ background: difference ? '#bd4916' : '#bfbfbf' }}/>Control</span><span><i style={{ background: difference ? '#187b45' : '#18a257' }}/>Treatment</span></div>;
}

const checks = [
  { id: 'users', title: 'Users per group', max: 50000, axis: '50k', unit: '', positive: true },
  { id: 'message-dau', title: 'Message DAU', max: 20, axis: '20', unit: '%', positive: false },
  { id: 'early-sat', title: 'SAT Rate', max: 100, axis: '100', unit: '%', positive: false },
  { id: 'zq-engagement', title: 'ZQ clicks', max: 10, axis: '10', unit: '%', positive: true },
] as const;

function ExperimentChecks({ data }: Pick<DesignReportProps, 'data'>) {
  return <Section title="Experiment checks"><Card className={styles.card}><Legend/><div className={styles.checkGrid}>
    {checks.map(check => {
      const metric = data.metrics.find(m => m.id === check.id);
      const values = check.id === 'users' ? bebopContext.sampleBalance : investigationMetric(metric!);
      return <figure key={check.id} className={styles.check} aria-label={`${check.title}: Control ${values.control}${check.unit}, Treatment ${values.treatment}${check.unit}`}>
        <h3>{check.title}</h3><div className={styles.pairPlot}>
          <div className={styles.yAxis}><span>{check.axis}</span><span>{check.unit ? '0' : '0k'}</span></div>
          <div className={styles.pair}><div className={styles.baseline}><DesignVector file="559c3" fit/></div>
            {(['control', 'treatment'] as const).map(group => <div className={styles.barColumn} key={group}>
              <span className={styles.barValue}>{values[group]}{check.unit}</span>
              <div className={styles.bar} style={{ height: `${values[group] / check.max * 118}px`, background: group === 'control' ? '#bfbfbf' : check.positive ? '#18a257' : '#bd4916' }}/>
              <span className={styles.groupName}>{group === 'control' ? 'Control' : 'Treatment'}</span>
            </div>)}
          </div>
        </div>
      </figure>;
    })}
  </div></Card></Section>;
}

const comparisonMetrics = [
  { id: 'message-dau', name: 'Message DAU', delta: -.47, asset: '247bc' },
  { id: 'early-sat', name: 'SAT Rate', delta: -4.34, asset: '3a9c2' },
  { id: 'zq-engagement', name: 'ZQ clicks', delta: 3.94, asset: '4fd48' },
  { id: 'stop-generating', name: 'Stop generation rate', delta: .49, asset: '04b1a' },
  { id: 'non-zq-cancel', name: 'Non-ZQ stop generation', delta: .72, asset: '0dffb' },
] as const;

function MetricComparison({ onAsk, onEvidence }: Pick<DesignReportProps, 'onAsk' | 'onEvidence'>) {
  const [group, setGroup] = useState('treatment');
  const treatment = group === 'treatment';
  const comparison = treatment ? 'Treatment − Control' : 'Control − Treatment';
  return <Section title="Metric comparison"><Card className={styles.card}>
    <h3 className={styles.comparisonTitle}>ZQ clicks rise; active usage and inferred SAT decline</h3>
    <Tabs value={group} onValueChange={setGroup}><TabsList aria-label="Metric comparison group" className={styles.tabs}><TabsTrigger value="treatment">Treatment</TabsTrigger><TabsTrigger value="control">Control</TabsTrigger></TabsList></Tabs>
    <div className={styles.comparisonContent}><Legend difference/>
      <figure className={styles.differences} aria-label={`${comparison}, percentage points`} title={`${comparison} · percentage points`} data-comparison-group={group}>
        <div className={styles.metricNames}>{comparisonMetrics.map(metric => <Button variant="ghost" key={metric.id} onClick={() => onEvidence(`case-metric:${metric.id}`)}>{metric.name}</Button>)}</div>
        <div className={styles.differencePlot}>
          <div className={styles.zeroLine}/>
          {comparisonMetrics.map(metric => {
            const delta = metric.delta * (treatment ? 1 : -1);
            return <div className={styles.differenceRow} key={metric.id} aria-label={`${metric.name}: ${delta > 0 ? '+' : ''}${delta.toFixed(2)} pp`}>
              <div className={styles.differenceBar} style={{ left: `${50 + Math.min(0, delta) * 10}%`, width: `${Math.abs(delta) * 10}%` }}>
                <DesignVector file={metric.asset} fit/>
                <span className={styles.delta} data-negative={delta < 0}>{delta > 0 ? '+' : ''}{delta.toFixed(2)}</span>
              </div>
            </div>;
          })}
          <div className={styles.differenceAxis}><span>-5 pp</span><span>0 pp</span><span>+5 pp</span></div>
        </div>
      </figure>
    </div>
    <div className={styles.questions}>{[
      ['Why did ZQ clicks rise 3.94 pp?', 'case-metric:zq-engagement'],
      ['Why did non-ZQ stops rise 0.72 pp?', 'case-metric:non-zq-cancel'],
      ['Is the 4.34 pp SAT drop significant?', 'case-metric:early-sat'],
    ].map(([question, id]) => <PromptSuggestion key={question} className={styles.question} onClick={() => onAsk(question, [id])}>{question}</PromptSuggestion>)}</div>
  </Card></Section>;
}

const chains = [
  { id: 'sustained-use', asset: '05726', finding: 'The cause of lower sustained use is unresolved.', hypotheses: [
    { text: 'ZQ may encourage trials without repeat use.', action: 'Test ZQ variants; track completion and return.', plan: 'zq', button: 'Add ZQ test' },
    { text: 'Removing Web/Work switching may disrupt some tasks.', action: 'Test restoring the switch within Premium.', plan: 'web-work', button: 'Add switch test' },
  ] },
  { id: 'cancellation', asset: 'a8fd8', finding: 'The cause of higher cancellation is unresolved.', hypotheses: [
    { text: 'Limited progress feedback may lead users to cancel.', action: 'Test Thinking feedback; measure completion.', plan: 'thinking', button: 'Add feedback test' },
    { text: 'Users may cancel to submit the next request.', action: 'Test queued prompts; track cancellation and completion.', plan: 'queued', button: 'Add queued-prompt test' },
  ] },
  { id: 'measurement', asset: 'c6ed4', finding: 'Sample ratio and data-quality warnings need review.', hypotheses: [
    { text: 'Measurement or population differences may distort results.', action: 'Audit allocation, metric definitions and comparison windows.', plan: 'data-audit', button: 'Add measurement audit' },
  ] },
] as const;

function Findings({ data, branch, onAction }: Pick<DesignReportProps, 'data' | 'branch' | 'onAction'>) {
  return <Section title="Findings & next steps"><Card className={`${styles.card} ${styles.findings}`}>
    <div className={styles.confirmed}><p>Message DAU −0.47 pp; sessions per user also decline.</p><p>Inferred SAT −4.34 pp; cancellations rise in both entry paths.</p></div>
    <div className={styles.columnHead} aria-hidden="true"><span>Key finding</span><span>Unverified hypothesis</span><span>Next action</span></div>
    {chains.map(chain => <div className={styles.chain} key={chain.id} data-finding-chain={chain.id}>
      <div className={styles.pending}>{chain.finding}</div>
      <div className={styles.branchConnector}><DesignVector file={chain.asset}/></div>
      <div className={styles.branches}>{chain.hypotheses.map(hypothesis => {
        const plan = data.plans.find(p => p.id === hypothesis.plan)!;
        const added = branch.actions.some(action => action.title === plan.title);
        return <div className={styles.hypothesisRow} key={hypothesis.plan} data-hypothesis={hypothesis.plan}>
          <div className={styles.hypothesis}>{hypothesis.text}</div>
          <div className={styles.arrow}><DesignVector file="23808"/></div>
          <div className={styles.action}><p>{hypothesis.action}</p><Button variant="outline" className={styles.actionButton} disabled={added} onClick={() => onAction(planFinding(plan))}><DesignVector file={added ? 'd9e2a' : 'f8b99'}/>{added ? 'Added' : hypothesis.button}</Button></div>
        </div>;
      })}</div>
    </div>)}
  </Card></Section>;
}

export function DesignReportSections(props: DesignReportProps) {
  return <div className={styles.sections}>
    <ExperimentChecks data={props.data}/>
    <MetricComparison onAsk={props.onAsk} onEvidence={props.onEvidence}/>
    <Section title="Detailed analysis"><MetricBreakdownPanel/></Section>
    <Findings data={props.data} branch={props.branch} onAction={props.onAction}/>
  </div>;
}
