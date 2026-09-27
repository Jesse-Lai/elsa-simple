'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Database } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { caseMetricCalculations, caseMetricDefinition, caseRawMetric, resolveCaseEvidence } from '@/lib/metis/case-evidence';
import { bebopContext, investigationMetric } from '@/lib/metis/bebop-investigation';
import { caseSourceUrl, caseValue } from '@/lib/metis/case-study';
import { signed } from '@/lib/metis/metric-analysis';
import type { CaseMetric, CaseSource } from '@/lib/metis/case-study-types';
import { useExperimentData } from './experiment-data';

export function RawMetricTable({ metrics, onMetric }: { metrics: CaseMetric[]; onMetric: (id: string) => void }) {
  return <Table aria-label="Raw source data">
    <TableHeader><TableRow><TableHead>Metric / window</TableHead><TableHead>Control /<br/>Non-Bebop</TableHead><TableHead>Treatment /<br/>Bebop</TableHead><TableHead>Source unit</TableHead><TableHead>Reported Δ%</TableHead><TableHead>p-value</TableHead><TableHead>Source</TableHead></TableRow></TableHeader>
    <TableBody>{metrics.map(record => { const metric = caseRawMetric(record); return <TableRow key={metric.id}>
      <TableCell className="min-w-56 max-w-80 whitespace-normal py-3"><Button variant="link" className="h-auto p-0 text-left whitespace-normal" onClick={() => onMetric(metric.id)}>{investigationMetric(metric).name}<ArrowUpRight className="size-3 shrink-0"/></Button><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{metric.window}</p></TableCell>
      <TableCell className="tabular-nums">{caseValue(metric, metric.control)}</TableCell><TableCell className="font-medium tabular-nums">{caseValue(metric, metric.treatment)}</TableCell>
      <TableCell>{metric.unit}</TableCell><TableCell className="tabular-nums">{metric.reportedRelative === undefined ? '—' : `${signed(metric.reportedRelative)}%`}</TableCell><TableCell className="tabular-nums">{metric.pValue ?? '—'}</TableCell><TableCell className="text-xs text-muted-foreground">{metric.sourceIds.join(', ')}</TableCell>
    </TableRow>; })}</TableBody>
  </Table>;
}

function MetricDefinition({ metric, showNotes = true }: { metric: CaseMetric; showNotes?: boolean }) {
  const definition = caseMetricDefinition(metric), calculation = caseMetricCalculations(metric);
  return <div className="space-y-4 text-sm leading-relaxed">
    <div className="space-y-1"><p className="font-medium">{definition.basis}</p><p className="text-muted-foreground">{metric.window}</p></div>
    <Card className="py-4"><CardContent className="space-y-3 px-4">
      <div><p className="text-xs text-muted-foreground">{definition.formulaLabel}</p><p className="mt-1 font-mono text-sm break-words">{definition.formula}</p></div>
      <Separator/>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><p className="font-medium">Absolute change = Treatment − Control</p><p className="mt-1 tabular-nums text-muted-foreground">{calculation.absolute}</p></div>
        <div><p className="font-medium">Relative change = (Treatment − Control) ÷ Control × 100</p><p className="mt-1 tabular-nums text-muted-foreground">{calculation.relative}</p></div>
      </div>
    </CardContent></Card>
    {showNotes && <div className="space-y-2 text-muted-foreground"><p>{definition.limitation}</p><p>{metric.note}</p></div>}
  </div>;
}

function OriginalMaterials({ sources }: { sources: CaseSource[] }) {
  return <Accordion type="multiple" aria-label="Original source materials">{sources.map(source => <AccordionItem key={source.id} value={source.id}>
    <AccordionTrigger>{source.id} · {source.title}</AccordionTrigger>
    <AccordionContent className="space-y-3"><p className="text-sm leading-relaxed text-muted-foreground">{source.detail}</p>{/\.(png|jpe?g)$/.test(source.file)
      ? <a href={caseSourceUrl(source.file)} target="_blank" rel="noreferrer" aria-label={`Open full-size source ${source.id}`}><img src={caseSourceUrl(source.file)} alt={`${source.id}: ${source.title}`} className="mt-3 h-auto w-full rounded-lg border" loading="lazy"/></a>
      : <Button variant="outline" size="sm" asChild><a href={caseSourceUrl(source.file)} download>Open source file<ArrowUpRight/></a></Button>}</AccordionContent>
  </AccordionItem>)}</Accordion>;
}

function EvidenceContent({ evidenceId }: { evidenceId: string }) {
  const dataset = useExperimentData(), data = dataset.caseStudy!;
  const [selection, setSelection] = useState(evidenceId);
  const body = useRef<HTMLDivElement>(null), title = useRef<HTMLHeadingElement>(null);
  const all = selection === 'all';
  const selected = resolveCaseEvidence(dataset, selection);
  const metrics = all ? data.metrics : selected.metrics;
  const sources = all ? data.sources : selected.sources;
  const single = !all && metrics.length === 1 ? metrics[0] : null;
  const navigate = (next: string) => {
    setSelection(next);
    body.current?.scrollTo({ top: 0 });
    title.current?.focus();
  };
  return <DialogContent className="metis-viz flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
    <DialogHeader className="shrink-0 border-b px-6 py-5 pr-12 text-left">
      <DialogTitle ref={title} tabIndex={-1} className="leading-snug outline-none">{all ? 'All raw data' : single ? `${investigationMetric(single).name} · Data details` : 'Data details'}</DialogTitle>
      <DialogDescription>{all ? data.title : sources.map(source => `${source.id} · ${source.title}`).join(' / ') || data.title}</DialogDescription>
    </DialogHeader>
    <div ref={body} className="min-h-0 space-y-6 overflow-y-auto p-6">
      {!all && <section className="space-y-4" aria-label="Data definition and formulas">
        <h3 className="font-semibold">Data definition & formulas</h3>
        {single ? <MetricDefinition metric={single} showNotes={false}/> : metrics.length ? <>
          <Card className="py-4"><CardContent className="space-y-2 px-4 text-sm leading-relaxed"><p><strong>Absolute change</strong> = Treatment − Control · percentage points for percentage rates</p><p><strong>Relative change</strong> = (Treatment − Control) ÷ Control × 100</p><p className="text-muted-foreground">Source ratios are multiplied by 100 for display as percentages. Each metric retains its own observation window and aggregation.</p></CardContent></Card>
          <Accordion type="single" collapsible>{metrics.map(metric => <AccordionItem key={metric.id} value={metric.id}><AccordionTrigger>{investigationMetric(metric).name} · definition</AccordionTrigger><AccordionContent><MetricDefinition metric={metric}/></AccordionContent></AccordionItem>)}</Accordion>
        </> : <p className="text-sm text-muted-foreground">This material contains discussion or proposals. No metric formula or numeric comparison was supplied.</p>}
      </section>}
      <section className="space-y-3" aria-label="Original data table">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{all ? 'All source measurements' : 'Raw source values'}</h3><Badge variant="secondary">{metrics.length} {metrics.length === 1 ? 'record' : 'records'}</Badge></div>
        <p className="text-sm leading-relaxed text-muted-foreground">Source-reported aggregates, preserved on their recorded scales. Event-level data and per-metric counts were not supplied.</p>
        {metrics.length ? <RawMetricTable metrics={metrics} onMetric={id => navigate(`case-metric:${id}`)}/> : <Alert role="note"><AlertTitle>No numeric measurements in this source</AlertTitle><AlertDescription><p>View all raw data to inspect the available records.</p></AlertDescription></Alert>}
        <p className="text-xs leading-relaxed text-muted-foreground">“—” means not supplied. Reported Δ% comes from the source and may differ from calculations using rounded values. Select a metric for its definition and calculation.</p>
        {single && <Accordion type="single" collapsible><AccordionItem value="definition-notes"><AccordionTrigger>Definition notes</AccordionTrigger><AccordionContent className="space-y-2 leading-relaxed text-muted-foreground"><p>{caseMetricDefinition(single).limitation}</p><p>{single.note}</p></AccordionContent></AccordionItem></Accordion>}
      </section>
      {all && <section className="space-y-3" aria-label="Context observations"><h3 className="font-semibold">Context observations</h3>
        <Table><TableHeader><TableRow><TableHead>Observation</TableHead><TableHead>Non-Bebop</TableHead><TableHead>Bebop</TableHead><TableHead>Source</TableHead></TableRow></TableHeader><TableBody>
          {bebopContext.queryMix.rows.map(row => <TableRow key={row.name}><TableCell>{row.name}</TableCell><TableCell>{row.control}%</TableCell><TableCell>{row.treatment}%</TableCell><TableCell>S04</TableCell></TableRow>)}
          <TableRow><TableCell>Web/Work switch usage</TableCell><TableCell colSpan={2}>≈10% of sessions · historical, no A/B split</TableCell><TableCell>S05</TableCell></TableRow>
          <TableRow><TableCell>2-day engagement</TableCell><TableCell colSpan={2}>Lower · numeric values not supplied</TableCell><TableCell>S02</TableCell></TableRow>
        </TableBody></Table><p className="text-xs leading-relaxed text-muted-foreground">{bebopContext.queryMix.note} Historical switch usage is not click-through rate.</p>
      </section>}
      <section className="space-y-2"><h3 className="font-semibold">Original materials</h3><OriginalMaterials sources={sources}/></section>
    </div>
    <DialogFooter className="shrink-0 items-center border-t px-6 py-4 sm:justify-between">
      <p className="text-xs text-muted-foreground">{all ? `${data.metrics.length} metric records · ${data.sources.length} source references` : 'View the complete dataset and supplied source files.'}</p>
      {all ? <Button variant="outline" onClick={() => navigate(evidenceId)}><ArrowLeft/>Back to details</Button> : <Button onClick={() => navigate('all')}><Database/>View all raw data<ArrowRight/></Button>}
    </DialogFooter>
  </DialogContent>;
}

export function CaseEvidenceDialog({ evidenceId, onClose }: { evidenceId: string | null; onClose: () => void }) {
  const dataset = useExperimentData();
  if (!dataset.caseStudy) return null;
  return <Dialog open={Boolean(evidenceId)} onOpenChange={open => { if (!open) onClose(); }}>{evidenceId && <EvidenceContent key={evidenceId} evidenceId={evidenceId}/>}</Dialog>;
}
