'use client';

import { useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { currentUserId, experimentOptions } from '@/lib/metis/experiment-catalog';
import { datasetForUrl } from '@/lib/metis/datasets';
import { decisionLabels, matchesLibraryFilter, type LibraryFilter } from '@/lib/metis/library-overview';
import { libraryPreview } from '@/lib/metis/library-preview';
import { LibraryDecisionBadge, LibraryOverview } from './library-overview';
import type { ExperimentDataset } from '@/lib/metis/types';
import styles from './experiment-library.module.css';

const groups = [...new Set(experimentOptions.map(experiment => experiment.group))];

export function ExperimentLibrary({ onAnalyze, busy, followedExperimentIds }: {
  onAnalyze: (dataset: ExperimentDataset) => void;
  busy: boolean;
  followedExperimentIds: string[];
}) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [scope, setScope] = useState('all');
  const [status, setStatus] = useState<LibraryFilter>('all');
  const search = query.trim().toLowerCase();
  const scopedExperiments = experimentOptions.filter(experiment =>
    scope === 'mine' ? experiment.ownerId === currentUserId :
    scope === 'followed' ? followedExperimentIds.includes(experiment.id) : true);
  const matchedExperiments = scopedExperiments.filter(experiment =>
    (group === 'all' || experiment.group === group) &&
    `${experiment.name} ${experiment.id} ${experiment.group}`.toLowerCase().includes(search));
  const experiments = matchedExperiments.filter(experiment => matchesLibraryFilter(experiment, status));
  const filtered = Boolean(search) || group !== 'all' || status !== 'all';
  function clearFilters() { setQuery(''); setGroup('all'); setStatus('all'); }
  const emptyScope = !filtered && scopedExperiments.length === 0;

  return <section className="min-h-0 flex-1 overflow-y-auto px-5 py-8 md:px-10 md:py-12" aria-labelledby="experiment-library-title">
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-2">
        <h1 id="experiment-library-title" className="text-3xl font-semibold tracking-tight">Experiment library</h1>
        <p className="text-sm leading-6 text-muted-foreground">All experiments you have access to. Pick one to start an analysis.</p>
      </div>

      <LibraryOverview experiments={matchedExperiments} filter={status} onFilter={setStatus}/>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <InputGroup className="h-10 w-full shadow-none sm:w-auto sm:min-w-52 sm:max-w-sm sm:flex-1">
            <InputGroupInput aria-label="Search experiments" placeholder="Search experiments…" value={query} onChange={event=>setQuery(event.target.value)}/>
            <InputGroupAddon><Search aria-hidden="true"/></InputGroupAddon>
            {query && <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label="Clear search" onClick={()=>setQuery('')}><X/></InputGroupButton></InputGroupAddon>}
          </InputGroup>
          <Select value={scope} onValueChange={value=>{setScope(value);setStatus('all');}}>
            <SelectTrigger aria-label="Filter experiments" className="w-44 bg-background shadow-none data-[size=default]:h-10"><SelectValue/></SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value="all">All experiments</SelectItem>
              <SelectItem value="mine">My experiments</SelectItem>
              <SelectItem value="followed">Followed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger aria-label="Filter by group" className="w-40 bg-background shadow-none data-[size=default]:h-10 sm:w-48"><SelectValue/></SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value="all">All groups</SelectItem>
              {groups.map(name=><SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
          <p role="status" className="text-xs whitespace-nowrap text-muted-foreground sm:ml-auto">{filtered ? `${experiments.length} of ${scopedExperiments.length}` : scopedExperiments.length} {scopedExperiments.length === 1 ? 'experiment' : 'experiments'}</p>
        </div>
        {status !== 'all' && <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Showing {status === 'completed' ? 'completed experiments' : decisionLabels[status].toLowerCase()}</span><Button variant="ghost" size="icon-sm" aria-label="Clear status filter" onClick={()=>setStatus('all')}><X/></Button></div>}

        <Table className={styles.table}>
          <TableHeader className={styles.header}><TableRow className="hover:bg-transparent">
            <TableHead scope="col" className={styles.experimentHeading}>Experiment</TableHead>
            <TableHead scope="col" className={styles.readoutHeading}>Key readout</TableHead>
            <TableHead scope="col" className={styles.actionHeading}><span className="sr-only">View analysis</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {experiments.map(experiment => {
              const data = datasetForUrl(experiment.url);
              const preview = libraryPreview(data);
              return <TableRow key={experiment.id} className={styles.row} data-interactive={Boolean(data && !busy)} onClick={event=>{if(data&&!busy&&!(event.target as HTMLElement).closest('a,button,[data-slot="badge"]'))onAnalyze(data);}}>
                <TableCell className={styles.identity}>
                  {data ? <a className={styles.name} href={`/?experiment=${encodeURIComponent(experiment.id)}`} aria-disabled={busy} onClick={event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();if(!busy)onAnalyze(data);}}>{experiment.name}</a> : <p className={styles.name}>{experiment.name}</p>}
                  <p className={styles.lifecycle}>{experiment.lifecycle === 'completed' ? 'Completed' : experiment.lifecycle === 'running' ? 'Running' : 'Status unknown'}</p>
                  {data && !data.caseStudy && <p className={styles.date}>Data through {data.experiment.end}</p>}
                </TableCell>
                <TableCell className={styles.readout}>
                  <LibraryDecisionBadge {...preview.decision}/>
                  <p className={styles.conclusion}>{preview.conclusion}</p>
                  {preview.evidence.length > 0 && <div className={styles.evidence}>
                    {preview.evidence.map(metric => <span className={styles.metric} key={metric.id}>
                      <span>{metric.label}</span>{' '}<strong data-tone={metric.tone}>{metric.value}</strong>
                      {metric.detail && <span className={styles.metricDetail}> · {metric.detail}</span>}
                    </span>)}
                  </div>}
                </TableCell>
                <TableCell className={styles.action}>
                  <Button variant="ghost" size="icon-sm" disabled={!data || busy} aria-label={`View analysis for ${experiment.name}`} title={!data ? 'Experiment data is not connected yet' : busy ? 'Loading your workspace' : 'View analysis'} onClick={()=>{if(data)onAnalyze(data);}}><ChevronRight aria-hidden="true"/></Button>
                </TableCell>
              </TableRow>;
            })}
            {experiments.length === 0 && <TableRow className="hover:bg-transparent"><TableCell colSpan={3} className="py-16 text-center whitespace-normal"><Search aria-hidden="true" className="mx-auto mb-3 size-5 text-muted-foreground"/><p className="font-medium">{emptyScope && scope === 'followed' ? 'No followed experiments yet' : emptyScope && scope === 'mine' ? 'No experiments owned by you yet' : 'No experiments found'}</p><p className="mt-1 text-sm text-muted-foreground">{emptyScope ? 'Browse all experiments to find one to analyze.' : 'Try another name, ID, or group.'}</p><Button variant="outline" size="sm" className="mt-4" onClick={emptyScope ? ()=>setScope('all') : clearFilters}>{emptyScope ? 'Browse all experiments' : 'Clear filters'}</Button></TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-1 border-t pt-4 text-xs leading-5 text-muted-foreground sm:flex-row sm:justify-between">
          <p>Your analysis is saved automatically as you work.</p>
          <p>Sample catalog & lifecycle · Live platform not connected</p>
        </div>
      </div>
    </div>
  </section>;
}
