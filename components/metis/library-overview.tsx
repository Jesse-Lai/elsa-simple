'use client';

import type { CSSProperties } from 'react';
import { CircleCheck, FlaskConical, Rocket, TriangleAlert } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { decisionLabels, libraryOverview, type LibraryDecision, type LibraryFilter } from '@/lib/metis/library-overview';
import type { ExperimentOption } from '@/lib/metis/experiment-catalog';
import styles from './library-overview.module.css';

const decisions: LibraryDecision[] = ['attention', 'ship', 'continue', 'unassessed'];
const colors = { attention: '#bd304a', ship: '#187b45', continue: '#7367f0', unassessed: '#a1a1aa' };
const chartConfig = Object.fromEntries(decisions.map(key => [key, { label: decisionLabels[key], color: colors[key] }]));

export function LibraryDecisionBadge({ status, reason }: { status: LibraryDecision; reason: string }) {
  return <Tooltip><TooltipTrigger asChild><Badge tabIndex={0} className={styles.decision} style={{ '--decision-color': colors[status] } as CSSProperties}>{decisionLabels[status]}</Badge></TooltipTrigger><TooltipContent className="max-w-xs">{reason}</TooltipContent></Tooltip>;
}

export function LibraryOverview({ experiments, filter, onFilter }: {
  experiments: ExperimentOption[];
  filter: LibraryFilter;
  onFilter: (filter: LibraryFilter) => void;
}) {
  const summary = libraryOverview(experiments);
  const select = (next: LibraryFilter) => onFilter(filter === next ? 'all' : next);
  const cards = [
    { key: 'all' as const, label: 'Total experiments', value: summary.total, note: 'In this view', icon: FlaskConical },
    { key: 'completed' as const, label: 'Completed', value: summary.completed, note: `${summary.running} running · ${summary.unknownLifecycle} unknown`, icon: CircleCheck },
    { key: 'attention' as const, label: 'Needs attention', value: summary.decisions.attention, note: 'Risks to resolve before rollout', icon: TriangleAlert, color: colors.attention },
    { key: 'ship' as const, label: 'Ready to ship', value: summary.decisions.ship, note: 'Gradual rollout recommended', icon: Rocket, color: colors.ship },
  ];
  return <div className={styles.overview} aria-label="Experiment overview">
    <div className={styles.cards}>
      {cards.map(card => <Card key={card.key} className={styles.metricCard} data-active={filter === card.key && filter !== 'all'}>
        <button type="button" className={styles.metricButton} aria-pressed={filter === card.key} onClick={() => select(card.key)} aria-label={`${card.label}: ${card.value}`}>
          <span className={styles.metricHeading}>{card.label}<card.icon aria-hidden="true"/></span>
          <span className={styles.metricValue} style={{ '--metric-color': card.color } as CSSProperties}>{card.value}</span>
          <span className={styles.metricNote}>{card.note}</span>
        </button>
      </Card>)}
    </div>
    <Card className={styles.distribution}>
      <div className={styles.distributionHeading}><h2 className="text-sm font-medium">Decision readiness</h2><span className="text-xs text-muted-foreground">{summary.total - summary.decisions.unassessed} of {summary.total} assessed</span></div>
      {summary.total ? <ChartContainer config={chartConfig} className={styles.chart} aria-hidden="true">
        <BarChart layout="vertical" data={[{ name: 'Experiments', ...summary.decisions }]} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} accessibilityLayer={false}>
          <XAxis type="number" domain={[0, summary.total]} hide/><YAxis dataKey="name" type="category" hide/>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel/>}/>
          {decisions.map(key => <Bar key={key} dataKey={key} stackId="readiness" fill={`var(--color-${key})`} stroke="var(--background)" strokeWidth={2} radius={4} isAnimationActive={false} onClick={() => select(key)} style={{ cursor: 'pointer' }}/>) }
        </BarChart>
      </ChartContainer> : <p className={styles.empty}>No experiments in this view.</p>}
      <div className={styles.legend} role="group" aria-label="Filter by decision readiness">
        {decisions.map(key => <Button key={key} variant="ghost" className={styles.legendButton} data-active={filter === key} aria-pressed={filter === key} onClick={() => select(key)}>
          <span aria-hidden="true" className={styles.dot} style={{ '--decision-color': colors[key] } as CSSProperties}/><span className={styles.legendLabel}>{decisionLabels[key]}</span><span className={styles.legendValue}>{summary.decisions[key]}</span>
        </Button>)}
      </div>
    </Card>
  </div>;
}
