'use client';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription } from '@/components/ui/card';
import { useExperimentData } from './experiment-data';

export function EvidenceChips({ ids, onOpen }: { ids: string[]; onOpen: (id: string) => void }) {
  const {evidenceById}=useExperimentData();
  return <div className="flex flex-wrap gap-2">{ids.filter(id=>evidenceById[id]).map(id=><Button key={id} variant="outline" size="sm" className="max-w-full" onClick={()=>onOpen(id)}><span className="truncate">{evidenceById[id].title}</span><ArrowUpRight/></Button>)}</div>;
}
export function Eyebrow({ children }: { children: React.ReactNode }) { return <Badge variant="outline">{children}</Badge>; }

export function DecisionBadge({ status, children }: { status: 'warning' | 'passed' | 'observing'; children: React.ReactNode }) {
  const styles = {
    warning: 'border-red-200 bg-red-50 text-red-700',
    passed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    observing: 'border-blue-200 bg-blue-50 text-blue-700',
  };
  const labels = { warning: 'Warning', passed: 'Passed', observing: 'Continue observing' };
  return <Badge variant="secondary" data-decision={status} className={`h-auto max-w-full whitespace-normal ${styles[status]}`}><span className="sr-only">{labels[status]}: </span>{children}</Badge>;
}

export type ConclusionTone = 'negative' | 'mixed' | 'positive';

export function ConclusionCard({ tone, children }: { tone: ConclusionTone; children: React.ReactNode }) {
  const styles = {
    negative: 'border-[#ebd7d3] bg-[#f9ede8] [--conclusion-label:#9b4e40]',
    mixed: 'border-[#dce2ee] bg-[#edf0f7] [--conclusion-label:#2563eb]',
    positive: 'border-[#e0e6d9] bg-[#edf1e8] [--conclusion-label:#52663f]',
  };
  return <Card data-conclusion={tone} className={`min-w-0 gap-6 rounded-2xl p-5 shadow-none md:p-7 ${styles[tone]}`}>
    {children}
  </Card>;
}

export function ConclusionLabel() {
  return <CardDescription className="text-2xl font-semibold leading-snug tracking-tight text-(--conclusion-label)">Conclusion</CardDescription>;
}
