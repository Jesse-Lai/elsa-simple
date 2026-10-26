'use client';

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { number } from '@/lib/metis/metric-analysis';
import type { CaseMetric } from '@/lib/metis/case-study-types';
import { caseDelta, caseSignal } from '@/lib/metis/case-study';
import styles from './bebop-investigation.module.css';

export type ComparisonUnit = CaseMetric['unit'] | 'users';
export const groupColors = { control: '#9299a5', treatment: '#5076d9' };
const config = { control: { label: 'Control', color: groupColors.control }, treatment: { label: 'Treatment', color: groupColors.treatment } };

export function comparisonValue(value: number, unit: ComparisonUnit) {
  return unit === 'users' ? value.toLocaleString('en-US') : `${number(value, 3)}${unit === '%' ? '%' : unit === 's' ? ' s' : unit === '/user' ? ' /user' : ''}`;
}

export function comparisonMaximum(values: number[], unit: ComparisonUnit) {
  const high = Math.max(...values, 0.1);
  const magnitude = 10 ** Math.floor(Math.log10(high));
  const max = ([1, 2, 2.5, 5, 10].find(step => step * magnitude >= high) ?? 10) * magnitude;
  return unit === '%' ? Math.min(100, max) : max;
}

export function GroupLegend() {
  return <div className={styles.legend} aria-label="Chart legend">
    <span><i style={{ background: groupColors.control }}/>Control</span>
    <span><i style={{ background: groupColors.treatment }}/>Treatment</span>
  </div>;
}

export function PairBars({ title, control, treatment, unit, max }: {
  title: string; control: number; treatment: number; unit: ComparisonUnit; max?: number;
}) {
  const upper = max ?? comparisonMaximum([control, treatment], unit);
  const format = (value: number) => comparisonValue(value, unit);
  const rows = [{ name: title, control, treatment }];
  return <figure className={styles.pairFigure} data-comparison={title} aria-label={`${title}: Control ${format(control)}${unit === 'users' ? ' users' : ''}, Treatment ${format(treatment)}${unit === 'users' ? ' users' : ''}. Scale starts at zero.`}>
    <ChartContainer className="metis-viz h-40 w-full aspect-auto" config={config}>
      <BarChart accessibilityLayer data={rows} margin={{ left: 0, right: 6, top: 24, bottom: 0 }} barSize={40} barGap={12}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4"/>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={false} height={24}/>
        <YAxis domain={[0, upper]} ticks={[0, upper]} axisLine={false} tickLine={false} width={35} tickFormatter={value => unit === 'users' ? `${number(Number(value) / 1000)}k` : number(Number(value))} fontSize={10}/>
        {(['control', 'treatment'] as const).map(key => <Bar key={key} dataKey={key} name={config[key].label} fill={groupColors[key]} radius={[3, 3, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey={key} position="top" offset={8} formatter={value => unit === '/user' ? number(Number(value), 3) : format(Number(value))} fontSize={11} fill="var(--foreground)"/>
          <LabelList dataKey={key} position="bottom" offset={9} formatter={() => config[key].label} fontSize={10} fill="var(--muted-foreground)"/>
        </Bar>)}
      </BarChart>
    </ChartContainer>
  </figure>;
}

// Each row retains its own zero-based axis and endpoint labels.
export function HorizontalMetricPair({ metric, onOpen }: { metric: CaseMetric; onOpen: () => void }) {
  const upper = comparisonMaximum([metric.control, metric.treatment], metric.unit);
  return <div className={styles.metricRow} data-horizontal-comparison={metric.id}>
    <div className={styles.metricLabel}>
      <button type="button" onClick={onOpen} className={styles.metricLink}>{metric.name}</button>
      <span className="case-signal text-xs font-medium tabular-nums" data-tone={caseSignal(metric).tone}>{caseDelta(metric)}</span>
    </div>
    <figure className={styles.horizontalFigure} aria-label={`${metric.name}: Control ${comparisonValue(metric.control, metric.unit)}, Treatment ${comparisonValue(metric.treatment, metric.unit)}. Change ${caseDelta(metric)}.`}>
      <div className={styles.horizontalPlot}>
        {[['Control', metric.control, groupColors.control], ['Treatment', metric.treatment, groupColors.treatment]].map(([name, value, color]) => <div className={styles.horizontalBarRow} key={name}>
          <div className={styles.horizontalTrack}><span className={styles.horizontalBar} data-group={name} style={{ width: `${Number(value) / upper * 100}%`, background: String(color) }}/></div>
          <span className={styles.barValue}>{comparisonValue(Number(value), metric.unit)}</span>
        </div>)}
      </div>
      <div className={styles.horizontalAxis}><span>0</span><span>{comparisonValue(upper, metric.unit)}</span></div>
    </figure>
  </div>;
}

export function CancellationSlices({ rows }: { rows: CaseMetric[] }) {
  const points = rows.map(m => ({ name: m.id === 'zq-cancel' ? 'ZQ' : 'Non-ZQ', control: m.control, treatment: m.treatment }));
  return <figure data-slice-chart="cancellation" aria-label={rows.map(m => `${m.name}: Control ${m.control}%, Treatment ${m.treatment}%`).join('. ')}>
    <ChartContainer className="metis-viz h-56 w-full aspect-auto" config={config}>
      <BarChart accessibilityLayer data={points} barSize={48} barGap={12} margin={{ left: 0, right: 12, top: 24, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4"/>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} fontSize={12}/>
        <YAxis domain={[0, 10]} ticks={[0, 5, 10]} width={36} tickFormatter={value => `${value}%`} axisLine={false} tickLine={false} fontSize={10}/>
        {(['control', 'treatment'] as const).map(key => <Bar key={key} dataKey={key} name={config[key].label} fill={groupColors[key]} radius={[3, 3, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey={key} position="top" offset={8} formatter={value => `${number(Number(value), 2)}%`} fontSize={12} fill="var(--foreground)"/>
        </Bar>)}
      </BarChart>
    </ChartContainer>
  </figure>;
}
