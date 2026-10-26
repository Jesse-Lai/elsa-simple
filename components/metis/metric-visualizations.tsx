'use client';

import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ErrorBar, LabelList, Rectangle, ReferenceLine, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { signed } from '@/lib/metis/metric-analysis';
import { comparisonBarDomain, comparisonDeltaDomain, comparisonDelta, comparisonInterval, comparisonRelative, comparisonUnit, comparisonValue, type ComparisonMetric } from '@/lib/metis/report-chart-data';

const color = (tone: ComparisonMetric['tone']) => tone === 'positive' ? 'var(--viz-positive)' : tone === 'negative' ? 'var(--viz-negative)' : 'var(--chart-2)';

function MetricTooltip({ metric }: { metric: ComparisonMetric }) {
  return <div className="space-y-2 text-xs">
    <p className="font-semibold">{metric.name}</p>
    <dl className="grid grid-cols-[auto_auto] gap-x-5 gap-y-1 tabular-nums">
      <dt>Control</dt><dd className="text-right">{comparisonValue(metric, metric.control)}</dd>
      <dt>Treatment</dt><dd className="text-right">{comparisonValue(metric, metric.treatment)}</dd>
      <dt>Change</dt><dd className="text-right">{comparisonDelta(metric)} / {comparisonRelative(metric)}</dd>
      <dt>95% CI</dt><dd className="text-right">{comparisonInterval(metric)}</dd>
    </dl>
    <p className="max-w-64 whitespace-normal text-muted-foreground">{metric.context}</p>
  </div>;
}

export function MetricComparisonBars({ metric, compact = false }: { metric: ComparisonMetric; compact?: boolean }) {
  const domain = comparisonBarDomain(metric);
  const points = [{ name: 'Control', value: metric.control, fill: 'var(--chart-2)' }, { name: 'Treatment', value: metric.treatment, fill: color(metric.tone) }];
  return <figure className={compact ? "min-w-0" : "min-w-0 border-t pt-3"} aria-label={`${metric.name}: Control ${comparisonValue(metric, metric.control)}, Treatment ${comparisonValue(metric, metric.treatment)}. Bar scale ${comparisonValue(metric, 0)} to ${comparisonValue(metric, domain[1])}.`}>
    <ChartContainer className="metis-viz h-20 w-full aspect-auto" config={{ value: { label: metric.name } }}>
      <BarChart accessibilityLayer layout="vertical" data={points} margin={{ left: 0, right: metric.unit === '%' ? 52 : 72, top: 4, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 5"/>
        <XAxis type="number" domain={domain} ticks={domain} tickFormatter={value => comparisonValue(metric, value)} axisLine={false} tickLine={false} tickMargin={7} height={24} fontSize={10}/>
        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={64} fontSize={10} interval={0}/>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={() => <MetricTooltip metric={metric}/>}/>}/>
        <Bar dataKey="value" maxBarSize={16} radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {points.map(point => <Cell key={point.name} fill={point.fill}/>)}
          <LabelList dataKey="value" position="right" offset={7} formatter={value => comparisonValue(metric, Number(value))} fontSize={12} fill="var(--foreground)"/>
        </Bar>
      </BarChart>
    </ChartContainer>
  </figure>;
}

export function MetricVisualCard({ metric, onOpen, openLabel, status, children, comparison, relativeLabel = 'relative', compact = false }: {
  metric: ComparisonMetric;
  onOpen: () => void;
  openLabel: string;
  status: { label: string; tone: string };
  children?: ReactNode;
  comparison?: ReactNode;
  relativeLabel?: string;
  compact?: boolean;
}) {
  return <Card className="case-metric min-w-0 gap-3" role="region" aria-label={`${metric.name}: ${comparisonDelta(metric)}, ${status.label}`}>
    <CardHeader className="flex min-h-10 items-start justify-between gap-2 px-4">
      <CardTitle className="min-w-0 text-sm leading-snug wrap-break-word"><h3>{metric.name}</h3></CardTitle>
      <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-1 shrink-0" aria-label={openLabel} onClick={onOpen}><ArrowUpRight className="size-4"/></Button>
    </CardHeader>
    <CardContent className="space-y-3 px-4">
      <div className="case-signal space-y-1" data-tone={metric.tone}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="case-delta whitespace-nowrap tabular-nums">{comparisonDelta(metric)}</p>
          <Badge variant="secondary" className="viz-status h-auto max-w-full whitespace-normal text-xs" data-tone={status.tone}>{status.label}</Badge>
        </div>
        {!compact && <p className="text-sm tabular-nums">{comparisonRelative(metric)} <span className="text-xs">{relativeLabel}</span></p>}
      </div>
      {comparison ?? <MetricComparisonBars metric={metric} compact={compact}/>}
    </CardContent>
    {children && <CardFooter className="mt-auto px-4">{children}</CardFooter>}
  </Card>;
}

function ChangeBar(props: unknown) {
  const { x, y, width, height, fill, payload } = props as { x: number; y: number; width: number; height: number; fill: string; payload: { metric: ComparisonMetric } };
  const metric = payload.metric;
  const label = `${metric.name}: Control ${comparisonValue(metric, metric.control)}, Treatment ${comparisonValue(metric, metric.treatment)}. Change ${comparisonDelta(metric)}, ${comparisonRelative(metric)} relative. 95% CI: ${comparisonInterval(metric)}.`;
  return <Rectangle x={x} y={y} width={width} height={height} radius={3} fill={fill} tabIndex={0} role="img" className="focus:stroke-foreground focus:stroke-3" aria-label={label}/>;
}

function ChangeBarLabel(props: unknown) {
  const { viewBox, value, raised } = props as { viewBox: { x: number; y: number; width: number; height: number }; value: number; raised?: boolean };
  const { x, y, width, height } = viewBox;
  const negative = Number(value) < 0;
  const end = negative ? Math.min(x, x + width) : Math.max(x, x + width);
  return <text x={end + (raised ? 0 : negative ? -8 : 8)} y={raised ? y - 9 : y + height / 2} textAnchor={raised ? 'middle' : negative ? 'end' : 'start'} dominantBaseline={raised ? 'auto' : 'central'} fontSize={12} fill="var(--foreground)">{signed(Number(value), 3)}</text>;
}

function MetricAxisLabel({ x = 0, y = 0, payload, rows }: { x?: number; y?: number; payload?: { value: number }; rows: ComparisonMetric[] }) {
  const metric = rows[payload?.value ?? -1];
  if (!metric) return null;
  const lines: string[] = [];
  for (const word of (metric.label ?? metric.name).split(' ')) {
    if (!lines.length || `${lines.at(-1)} ${word}`.length > 19) lines.push(word);
    else lines[lines.length - 1] += ` ${word}`;
  }
  return <text x={x - 8} y={y} textAnchor="end" fill="var(--muted-foreground)" fontSize={12}>
    {lines.map((line, index) => <tspan key={index} x={x - 8} dy={index === 0 ? -(lines.length - 1) * 7 + 4 : 14}>{line}</tspan>)}
  </text>;
}

export function MetricChangeChart({ rows, showNote = true }: { rows: ComparisonMetric[]; showNote?: boolean }) {
  if (!rows.length) return null;
  const domain = comparisonDeltaDomain(rows);
  const unit = comparisonUnit(rows[0]);
  const points = rows.map((metric, index) => {
    const change = metric.treatment - metric.control;
    return { metric, index, change, error: metric.ci ? [change - metric.ci[0], metric.ci[1] - change] : undefined };
  });
  const hasIntervals = rows.some(metric => metric.ci);
  return <figure className="min-w-0 space-y-3" aria-label={`Metric changes relative to Control in ${unit}`}>
    <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>Treatment − Control · {unit === 'pp' ? 'percentage points' : unit === '/user' ? 'sessions per user' : unit}</span><span>Left: lower · Right: higher</span></figcaption>
    <ChartContainer className="metis-viz w-full aspect-auto" style={{ height: rows.length * 64 + 64 }} config={{ change: { label: 'Absolute change' } }}>
      <BarChart accessibilityLayer layout="vertical" data={points} margin={{ left: 0, right: 40, top: 20, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 5"/>
        <XAxis type="number" dataKey="change" domain={domain} ticks={[domain[0], 0, domain[1]]} tickFormatter={value => `${signed(value, 3)} ${unit}`} axisLine={false} tickLine={false} fontSize={11}/>
        <YAxis type="category" dataKey="index" interval={0} tick={<MetricAxisLabel rows={rows}/>} axisLine={false} tickLine={false} width={130}/>
        <ReferenceLine x={0} stroke="var(--chart-2)" strokeWidth={1.5}/>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(_value, _name, item, index) => index === 0 ? <MetricTooltip metric={item.payload.metric as ComparisonMetric}/> : null}/>}/>
        <Bar name="Absolute change" dataKey="change" barSize={22} shape={ChangeBar} isAnimationActive={false}>
          {points.map(point => <Cell key={point.metric.id} fill={color(point.metric.tone)}/>)}
          {hasIntervals && <ErrorBar dataKey="error" direction="x" width={5} stroke="var(--foreground)" strokeWidth={1.5} isAnimationActive={false}/>}
          <LabelList dataKey="change" content={props => ChangeBarLabel({ ...props, raised: hasIntervals })}/>
        </Bar>
      </BarChart>
    </ChartContainer>
    {showNote && <p className="text-xs leading-relaxed text-muted-foreground">Bars show observed differences{hasIntervals ? '; whiskers show supplied 95% confidence intervals' : ', not confidence intervals'}. Green = favorable direction; orange = adverse direction.</p>}
  </figure>;
}
