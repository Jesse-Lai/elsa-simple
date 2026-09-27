import type { CaseMetric } from './case-study-types';
import { caseSignal } from './case-study';

const labels: Record<string,string> = {
  'query-submit':'Query submission', 'new-conversations':'New conversations',
  'zq-cancel':'ZQ', 'non-zq-cancel':'Non-ZQ',
};

// Only percentage rates can share a percentage-point axis. Preserve each
// record's window and provenance; ordering metrics does not imply a funnel.
export function caseDeltaPoints(metrics:CaseMetric[]) {
  if(metrics.some(m=>m.unit!=='%'))throw new Error('A percentage-point chart requires percentage metrics.');
  return metrics.map((metric,index)=>({
    metric,index,name:labels[metric.id]??metric.name,
    change:metric.treatment-metric.control,
    tone:caseSignal(metric).tone,
  }));
}

export function casePairPoints(metrics:CaseMetric[]) {
  if(metrics.some(m=>m.unit!=='%'))throw new Error('A rate comparison requires percentage metrics.');
  return metrics.map((metric,index)=>({metric,index,name:labels[metric.id]??metric.name,control:metric.control,treatment:metric.treatment}));
}

// Bar length encodes the value, so the baseline must remain zero. Each card
// labels its own upper bound; compare C/T heights within the same card.
export function caseRateBarDomain(metric:CaseMetric):[number,number] {
  if(metric.unit!=='%')throw new Error('A rate comparison requires percentage metrics.');
  const high=Math.max(metric.control,metric.treatment,.1);
  const magnitude=10**Math.floor(Math.log10(high));
  const step=magnitude/2;
  return [0,Math.min(100,Number((Math.ceil(high/step)*step).toFixed(6)))];
}
