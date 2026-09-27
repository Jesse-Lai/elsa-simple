'use client';

import { CartesianGrid, LabelList, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item';
import { ArrowUpRight } from 'lucide-react';
import { casePairPoints } from '@/lib/metis/case-chart-data';
import { caseDelta, caseRelative, caseSignal, caseValue } from '@/lib/metis/case-study';
import { number } from '@/lib/metis/metric-analysis';
import type { CaseMetric } from '@/lib/metis/case-study-types';
import { caseComparison } from '@/lib/metis/report-chart-data';
import { MetricChangeChart, MetricComparisonBars } from './metric-visualizations';

function EvidencePoint(props:unknown) {
  const {cx,cy,fill,stroke,strokeWidth,payload}=props as {cx:number;cy:number;fill?:string;stroke?:string;strokeWidth?:number;payload:{metric:CaseMetric}};
  const m=payload.metric, cancel=m.group==='cancel';
  return <circle cx={cx} cy={cy} r={5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} tabIndex={0} role="img" className="focus:stroke-foreground focus:stroke-3" aria-label={`${m.name}: ${cancel?'Non-Bebop':'Control'} ${caseValue(m,m.control)}, ${cancel?'Bebop':'Treatment'} ${caseValue(m,m.treatment)}. Change ${caseDelta(m)}, ${caseRelative(m)} relative. ${m.window}. Confidence interval unavailable.`}/>;
}

function MetricTooltip({metric:m,cancel=false}:{metric:CaseMetric;cancel?:boolean}) {
  return <div className="space-y-2 text-xs">
    <p className="font-semibold">{m.name}</p>
    <dl className="grid grid-cols-[auto_auto] gap-x-5 gap-y-1 tabular-nums">
      <dt>{cancel?'Non-Bebop':'Control'}</dt><dd className="text-right">{caseValue(m,m.control)}</dd>
      <dt>{cancel?'Bebop':'Treatment'}</dt><dd className="text-right">{caseValue(m,m.treatment)}</dd>
      <dt>Change</dt><dd className="text-right">{caseDelta(m)} / {caseRelative(m)}</dd>
    </dl>
    <p className="max-w-52 whitespace-normal text-muted-foreground">{m.window}</p>
    <p className="text-muted-foreground">Displayed-value calculation · CI unavailable</p>
  </div>;
}

export function CaseMetricBarChart({metric}:{metric:CaseMetric}) {
  return <MetricComparisonBars metric={caseComparison(metric)}/>;
}

export function CaseDeltaChart({rows,showNote=true}:{rows:CaseMetric[];showNote?:boolean}) {
  return <MetricChangeChart rows={rows.map(caseComparison)} showNote={showNote}/>;
}

export function CaseCancellationChart({rows}:{rows:CaseMetric[]}) {
  const points=casePairPoints(rows);
  const max=Math.max(1,Math.ceil(Math.max(...rows.flatMap(m=>[m.control,m.treatment]))));
  return <figure className="min-w-0 space-y-4" aria-label="ZQ and non-ZQ cancellation: paired rate comparison">
    <figcaption className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>User cancellation rate</span><span className="flex flex-wrap gap-4"><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-chart-2"/>Non-Bebop</span><span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-(--viz-negative)"/>Bebop</span></span></figcaption>
    <ChartContainer className="metis-viz h-56 w-full aspect-auto" config={{control:{label:'Non-Bebop',color:'var(--chart-2)'},treatment:{label:'Bebop',color:'var(--viz-negative)'}}}>
      <ScatterChart accessibilityLayer margin={{left:0,right:26,top:20,bottom:16}}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 5"/>
        <XAxis type="number" dataKey="value" domain={[0,max+1]} tickFormatter={v=>`${number(v)}%`} axisLine={false} tickLine={false} fontSize={12}/>
        <YAxis type="number" dataKey="index" domain={[-.5,points.length-.5]} ticks={points.map(p=>p.index)} reversed tickFormatter={v=>points[v]?.name??''} axisLine={false} tickLine={false} width={58} fontSize={12}/>
        <ZAxis range={[92,92]}/>
        {points.map(p=><ReferenceLine key={p.metric.id} segment={[{x:p.control,y:p.index},{x:p.treatment,y:p.index}]} stroke="var(--viz-negative)" strokeWidth={2} strokeOpacity={.45}/>) }
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(_value,_name,item,index)=>index===0?<MetricTooltip metric={item.payload.metric as CaseMetric} cancel/>:null}/>}/>
        <Scatter name="Non-Bebop" data={points.map(p=>({...p,value:p.control}))} fill="var(--background)" stroke="var(--chart-2)" strokeWidth={2} shape={EvidencePoint} isAnimationActive={false}>
          <LabelList dataKey="value" position="top" offset={12} formatter={v=>`${number(Number(v),2)}%`} fontSize={12} fill="var(--muted-foreground)"/>
        </Scatter>
        <Scatter name="Bebop" data={points.map(p=>({...p,value:p.treatment}))} fill="var(--viz-negative)" shape={EvidencePoint} isAnimationActive={false}>
          <LabelList dataKey="value" position="bottom" offset={12} formatter={v=>`${number(Number(v),2)}%`} fontSize={12} fill="var(--viz-negative)"/>
        </Scatter>
      </ScatterChart>
    </ChartContainer>
    <ItemGroup className="grid gap-3 sm:grid-cols-2">{rows.map(m=><Item key={m.id} role="listitem" variant="outline" size="sm"><ItemContent><ItemTitle>{m.name}</ItemTitle><p className="case-signal text-xl font-semibold tabular-nums" data-tone="negative">{caseDelta(m)} <span className="text-sm font-normal">/ {caseRelative(m)}</span></p></ItemContent></Item>)}</ItemGroup>
  </figure>;
}

export function CaseFeedbackMatrix({rows,onEvidence}:{rows:CaseMetric[];onEvidence:(id:string)=>void}) {
  return <Table className="min-w-[570px]" aria-label="Inferred satisfaction signals versus explicit feedback">
    <TableHeader><TableRow><TableHead>Signal</TableHead><TableHead>Control → Treatment</TableHead><TableHead>Change</TableHead><TableHead>Evidence</TableHead></TableRow></TableHeader>
    <TableBody>{rows.map(m=>{const direct=['early-thumbs','early-thumbs-down'].includes(m.id),signal=caseSignal(m);return <TableRow key={m.id}>
      <TableCell className="max-w-48 whitespace-normal py-4"><Badge variant="secondary" className="mb-2">{direct?'Explicit feedback':'Inferred behavior'}</Badge><Button variant="link" className="h-auto p-0 text-left text-sm whitespace-normal" onClick={()=>onEvidence(`case-metric:${m.id}`)}>{m.name}<ArrowUpRight className="size-3 shrink-0"/></Button></TableCell>
      <TableCell className="tabular-nums"><span className="text-muted-foreground">{caseValue(m,m.control)}</span><br/><span>→ {caseValue(m,m.treatment)}</span></TableCell>
      <TableCell className="case-signal tabular-nums" data-tone={signal.tone}><strong>{caseDelta(m)}</strong><p className="mt-1 text-xs">{caseRelative(m)} calculated</p></TableCell>
      <TableCell className="max-w-44 whitespace-normal"><Badge variant="secondary" className="viz-status mb-2" data-tone={signal.tone}>{direct?'Inconclusive':'Adverse signal'}</Badge><p className="text-xs text-muted-foreground">p = {m.pValue}{m.id==='early-thumbs'?' · Low count':''}</p><p className="mt-1 text-xs text-muted-foreground">{m.id==='early-dsat'?'Mainly stop generation':direct?'Does not establish equivalence':'Behavior-based estimate'}</p></TableCell>
    </TableRow>})}</TableBody>
  </Table>;
}
