'use client';

import { ArrowRight, ChevronDown, Equal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { caseRelative, caseSignal, caseValue } from '@/lib/metis/case-study';
import { signed } from '@/lib/metis/metric-analysis';
import type { CaseMetric } from '@/lib/metis/case-study-types';
import { caseComparison } from '@/lib/metis/report-chart-data';
import { MetricVisualCard } from './metric-visualizations';

export function CaseMetricVisual({metric:m,onEvidence,compact=false}:{metric:CaseMetric;onEvidence:(id:string)=>void;compact?:boolean}) {
  const signal=caseSignal(m);
  return <MetricVisualCard compact={compact} metric={caseComparison(m)} onOpen={()=>onEvidence(`case-metric:${m.id}`)} openLabel={`View ${m.name} source`} relativeLabel="calculated" status={{...signal,label:compact&&signal.tone!=='neutral'?(signal.tone==='positive'?'Favorable':'Adverse'):signal.label}} comparison={m.unit==='%'?undefined:<dl className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3 text-sm tabular-nums" aria-label={`${m.name}: Control and Treatment values`}>
      <div><dt className="text-xs text-muted-foreground">Control</dt><dd className="mt-1 font-medium">{caseValue(m,m.control)}</dd></div>
      {m.control===m.treatment?<Equal className="mt-4 size-4 shrink-0 text-muted-foreground" aria-label="Equal displayed values"/>:<ArrowRight className="mt-4 size-4 shrink-0 text-muted-foreground" aria-hidden/>}
      <div><dt className="text-xs text-muted-foreground">Treatment</dt><dd className="mt-1 font-medium">{caseValue(m,m.treatment)}</dd></div>
    </dl>}>
    {!compact&&<Collapsible>
      <CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="h-auto px-0 py-1 text-xs text-muted-foreground">{m.pValue?`p = ${m.pValue} · `:''}Source details<ChevronDown className="size-3"/></Button></CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2 text-sm leading-relaxed text-muted-foreground">
        <p>{m.window}</p><p>{m.note}</p>
        {m.reportedRelative!==undefined&&<p>{signed(m.reportedRelative)}% source-reported; {caseRelative(m)} calculated from displayed values.</p>}
        <p>Confidence interval not supplied.</p>
      </CollapsibleContent>
    </Collapsible>}
  </MetricVisualCard>;
}
