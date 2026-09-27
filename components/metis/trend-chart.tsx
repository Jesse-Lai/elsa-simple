'use client';

import { useId } from 'react';
import { Info } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { metricValue, number } from '@/lib/metis/metric-analysis';
import type { MetricId } from '@/lib/metis/types';
import { useExperimentData } from './experiment-data';

function ControlKey() {
  return <svg aria-hidden="true" width="18" height="10" viewBox="0 0 18 10"><path d="M1 5h16" stroke="var(--chart-2)" strokeWidth="2.5" strokeDasharray="4 3" strokeLinecap="round"/></svg>;
}

function TreatmentKey() {
  return <svg aria-hidden="true" width="18" height="10" viewBox="0 0 18 10"><path d="M1 5h16" stroke="var(--chart-1)" strokeWidth="2.5" strokeLinecap="round"/></svg>;
}

const seriesConfig = {
  control: { label: 'Control', color: 'var(--chart-2)', icon: ControlKey },
  treatment: { label: 'Treatment', color: 'var(--chart-1)', icon: TreatmentKey },
};

export function TrendChart({ metricId, compact = false }: { metricId: MetricId; compact?: boolean }) {
  const { metricById, trends } = useExperimentData();
  const gradientId = `trend-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const metric = metricById[metricId];
  const data = trends[metricId];

  if (!data) return <Alert><Info/><AlertTitle>Only the matured-cohort aggregate is available.</AlertTitle><AlertDescription>There is no daily retention series in this snapshot. The confidence interval is available in the metric summary.</AlertDescription></Alert>;

  return (
    <ChartContainer
      className={`metis-viz w-full aspect-auto ${compact ? 'h-64' : 'h-80'} [&_.recharts-cartesian-axis-tick_text]:fill-(--viz-muted)`}
      config={seriesConfig}
      aria-label={`${metric.name}: illustrative daily Control and Treatment values in ${metric.unit === '%' ? 'percent' : metric.unit === 'ms' ? 'milliseconds' : 'sessions per user'}.`}
    >
      <ComposedChart accessibilityLayer data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28}/>
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02}/>
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="var(--viz-border)"/>
        <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={36} tickMargin={12} height={38} fontSize={12}/>
        <YAxis axisLine={false} tickLine={false} domain={['auto', 'auto']} width={metric.unit === 'ms' ? 70 : 52} tickFormatter={value => `${number(value, 1)}${metric.unit === '%' ? '%' : metric.unit === 'ms' ? ' ms' : ''}`} tickMargin={10} fontSize={12}/>
        <ChartTooltip
          cursor={{ stroke: 'var(--chart-2)', strokeDasharray: '3 4', strokeOpacity: 0.5 }}
          content={<ChartTooltipContent
            className="metis-viz min-w-44 gap-3 rounded-lg border-(--viz-border) bg-white p-3 text-(--viz-heading) shadow-[0_4px_18px_rgba(47,43,61,0.16)]"
            labelClassName="border-b border-(--viz-border) pb-2 text-xs text-(--viz-muted)"
            formatter={(value, name) => <div className="flex w-full items-center gap-2.5 py-0.5">{name === 'control' ? <ControlKey/> : <TreatmentKey/>}<span className="text-(--viz-muted)">{name === 'control' ? 'Control' : 'Treatment'}</span><span className="ml-auto pl-4 font-semibold tabular-nums">{metricValue(metric, Number(value))}</span></div>}
          />}
        />
        <Area dataKey="treatment" type="monotone" stroke="none" fill={`url(#${gradientId})`} isAnimationActive={false} tooltipType="none" legendType="none"/>
        <Line dataKey="control" type="monotone" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" dot={false} activeDot={{ r: 4, fill: 'var(--chart-2)', stroke: 'white', strokeWidth: 2 }} isAnimationActive={false}/>
        <Line dataKey="treatment" type="monotone" stroke="var(--chart-1)" strokeWidth={2.5} strokeLinecap="round" dot={false} activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'white', strokeWidth: 3 }} isAnimationActive={false}/>
        <ChartLegend verticalAlign="top" content={<ChartLegendContent verticalAlign="top" className="justify-end gap-5 pb-6 text-xs text-(--viz-muted)"/>}/>
      </ComposedChart>
    </ChartContainer>
  );
}
