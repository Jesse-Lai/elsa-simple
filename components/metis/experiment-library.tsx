'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { ArrowRepeatAll16Regular, Warning16Regular, Star16Filled, Star16Regular } from '@fluentui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { experimentOptions, currentUserId } from '@/lib/metis/experiment-catalog';
import { datasetForUrl } from '@/lib/metis/datasets';
import type { ExperimentDataset } from '@/lib/metis/types';
import { DesignIcon } from './design-assets';
import { libraryReports } from '@/lib/metis/library-reports';
import styles from './experiment-library.module.css';
import { LibraryConversation } from './library-conversation';

// Presentation fixtures from frame 151:483, including its duplicate last row.
// Catalog snapshots and their analytical values are not modified by these labels.
const rows = [
  { key: 'onboarding', id: 'onboarding-refresh', name: 'Onboarding refresh', assessment: 'Needs attention', stage: '50%WW', progress: 49.78 },
  { key: 'checkout', id: 'checkout-simplification', name: 'Checkout simplification', assessment: 'Ready to ship', stage: '80%WW', progress: 79.31 },
  { key: 'bebop', id: 'bebop-5pct', name: 'Bebop design', assessment: 'Don’t expand rollout', stage: '5%WW', progress: 16.95 },
  { key: 'search', id: 'search-relevance', name: 'Search relevance', assessment: '', stage: 'MSIT', progress: 9.77 },
  { key: 'pricing', id: 'pricing-page-refresh', name: 'Pricing page refresh', assessment: '', stage: 'SDFv2', progress: 4.02 },
  { key: 'pricing-copy', id: 'pricing-page-refresh', name: 'Pricing page refresh', assessment: '', stage: 'SDFv2', progress: 4.02 },
];
const groups = [...new Set(experimentOptions.map(item => item.group))];
const starStorage = 'elsa-design-library-stars-v1';
let memoryStars: string | null = null;
function getStarSnapshot() { try { return localStorage.getItem(starStorage); } catch { return memoryStars; } }
function saveStars(stars: string[]) {
  memoryStars = JSON.stringify(stars);
  try { localStorage.setItem(starStorage, memoryStars); } catch { /* The in-memory snapshot remains usable. */ }
  window.dispatchEvent(new Event('elsa-library-stars'));
}
function subscribeToStars(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener('elsa-library-stars', onChange);
  return () => { window.removeEventListener('storage', onChange); window.removeEventListener('elsa-library-stars', onChange); };
}


function Filter({ label, name, value, onChange, options, disabled = false }: {label: string; name: string; value: string; onChange: (value: string) => void; options: string[]; disabled?: boolean}) {
  return <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger aria-label={name} className={styles.filter}><SelectValue/><DesignIcon file="da3a2" /></SelectTrigger>
    <SelectContent position="popper" align="start"><SelectItem value="all">{label}</SelectItem>{options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
  </Select>;
}

export function ExperimentLibrary({ onAnalyze, onReport, busy, active = true }: {
  onAnalyze: (dataset: ExperimentDataset) => void;
  onReport: (id: string) => void;
  busy: boolean;
  active?: boolean;
  followedExperimentIds: string[];
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [entity, setEntity] = useState('all');
  const [group, setGroup] = useState('all');
  const [owner, setOwner] = useState('all');
  const [starFilter, setStarFilter] = useState('all');
  const [contentType, setContentType] = useState('all');
  function changeContentType(value: string) {
    setContentType(value);
    if (value === 'Reports') {
      setStatus('all'); setEntity('all'); setGroup('all'); setOwner('all'); setStarFilter('all');
    }
  }
  const starSnapshot = useSyncExternalStore(subscribeToStars, getStarSnapshot, () => null);
  const stars = useMemo<string[]>(() => {
    try { const saved = JSON.parse(starSnapshot ?? 'null'); if (Array.isArray(saved) && saved.every(id => typeof id === 'string')) return saved; } catch { /* Keep the design defaults for malformed storage. */ }
    return rows.map(row => row.id);
  }, [starSnapshot]);
  function toggleStar(id: string) {
    const next = stars.includes(id) ? stars.filter(item => item !== id) : [...stars, id];
    saveStars(next);
  }
  const experiments = rows.filter(row => {
    const catalog = experimentOptions.find(item => item.id === row.id);
    return contentType !== 'Reports' && `${row.name} ${row.id}`.toLowerCase().includes(query.trim().toLowerCase()) &&
      (status === 'all' || status === 'Running' || status === row.assessment) &&
      (entity === 'all' || entity === catalog?.group) && (group === 'all' || group === catalog?.group) &&
      (owner === 'all' || (owner === 'My experiments' ? catalog?.ownerId === currentUserId : catalog?.ownerId !== currentUserId)) &&
      (starFilter === 'all' || (starFilter === 'Starred only' ? stars.includes(row.id) : !stars.includes(row.id)));
  });
  const reports = libraryReports.filter(report => contentType !== 'Experiments' &&
    `${report.title} ${report.summary}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    status === 'all' && entity === 'all' && group === 'all' && owner === 'all' && starFilter !== 'Starred only');
  return <section className={styles.library} aria-labelledby="experiment-library-title" data-node-id="151:485">
    <div className={styles.layout}>
    <div className={styles.content}>
      <div className={styles.overview}>
        <div className={styles.heading}><h1 id="experiment-library-title">Experiment library</h1><p>Browse experiments and reports you have access to.</p></div>
        <div className={styles.summary}>
          <div className={styles.stat}><div><span>Total experiments</span><DesignIcon file="b3d3f"/></div><strong>8</strong></div>
          <div className={styles.stat}><div><span>Running</span><ArrowRepeatAll16Regular aria-hidden="true"/></div><strong>3</strong></div>
          <div className={styles.stat}><div><span>Needs attention</span><Warning16Regular aria-hidden="true" className={styles.attentionIcon}/></div><strong className={styles.attention}>2</strong></div>
          <div className={styles.stat}><div><span>Completed</span><DesignIcon file="39bc5"/></div><strong>4</strong></div>
        </div>
      </div>
      <div className={styles.list}>
        <div className={styles.filters}>
          <div className={styles.search}><DesignIcon file="29ba2"/><Input aria-label="Search experiments and reports" placeholder="Search experiments and reports…" value={query} onChange={event => setQuery(event.target.value)}/></div>
          <Filter name="Filter by status" label="All status" value={status} onChange={setStatus} options={['Running', 'Needs attention', 'Ready to ship', 'Don’t expand rollout']} disabled={contentType === 'Reports'}/>
          <Filter name="Filter by entity type" label="Entity type" value={entity} onChange={setEntity} options={groups} disabled={contentType === 'Reports'}/>
          <Filter name="Filter by entity group" label="Entity type" value={group} onChange={setGroup} options={groups} disabled={contentType === 'Reports'}/>
          <Filter name="Filter by owner" label="Owners" value={owner} onChange={setOwner} options={['My experiments', 'Other owners']} disabled={contentType === 'Reports'}/>
          <Filter name="Filter by starred" label="Starred" value={starFilter} onChange={setStarFilter} options={['Starred only', 'Not starred']} disabled={contentType === 'Reports'}/>
          <Filter name="Filter by content type" label="All data" value={contentType} onChange={changeContentType} options={['Reports', 'Experiments']}/>
        </div>
        <div className={styles.rows}>
          {experiments.map(row => {
            const catalog = experimentOptions.find(item => item.id === row.id);
            const dataset = catalog ? datasetForUrl(catalog.url) : undefined;
            const starred = stars.includes(row.id);
            const attention = row.assessment === 'Needs attention';
            const open = () => { if (dataset && !busy) onAnalyze(dataset); };
            return <article key={row.key} className={styles.row} onClick={event => { if (!(event.target as HTMLElement).closest('button,a')) open(); }} data-interactive={Boolean(dataset)}>
              <div className={styles.identity}>
                <div className={styles.nameRow}>
                  {dataset ? <a className={styles.name} href={`/?experiment=${row.id}`} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); open(); }}>{row.name}</a> : <h2 className={styles.name}>{row.name}</h2>}
                  <Button variant="ghost" className={styles.star} aria-label={`${starred ? 'Unstar' : 'Star'} ${row.name}`} aria-pressed={starred} onClick={() => toggleStar(row.id)}>{starred ? <Star16Filled/> : <Star16Regular/>}</Button>
                </div>
                <p className={styles.date}>Started on Sep 14, 2026</p>
              </div>
              <div className={styles.readout}>
                <div className={styles.status}>Running{row.assessment && <span className={styles.badge} data-attention={attention} data-rollout-held={row.assessment === 'Don’t expand rollout'}>{row.assessment}</span>}</div>
                <div className={styles.rollout}><p>{row.stage}</p><div className={styles.track}><div style={{width: `${row.progress}%`}} data-early={row.stage === 'MSIT' || row.stage === 'SDFv2'}/></div></div>
                <p className={styles.metrics} data-attention={attention}>Activation rate <strong>{attention ? '-0.47 pp' : '+0.5 pp'}</strong>{'     '}Onboarding latency <strong>+64 ms</strong></p>
              </div>
            </article>;
          })}
          {reports.length > 0 && <section className={styles.reports} aria-labelledby="library-reports-title">
            <h2 id="library-reports-title">Reports</h2>
            {reports.map(report => <a key={report.id} href={`/?report=${report.id}`} className={styles.reportCard} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onReport(report.id); }}>
              {/* The thumbnail is the source image exported for this exact Figma card. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={report.image} alt="" width={161} height={110}/>
              <span className={styles.reportCopy}><span><strong>{report.title}</strong><small>Started on {report.date}</small></span><span>{report.summary}</span></span>
            </a>)}
          </section>}
          {experiments.length === 0 && reports.length === 0 && <p className={styles.empty} role="status">{contentType === 'Reports' ? 'No reports found' : contentType === 'Experiments' ? 'No experiments found' : 'No experiments or reports found'}</p>}
        </div>
      </div>
    </div>
    <div className={styles.conversation}>
      <LibraryConversation experiments={rows} active={active} onExperiment={id => { const catalog = experimentOptions.find(item => item.id === id); const dataset = catalog && datasetForUrl(catalog.url); if (dataset && !busy) onAnalyze(dataset); }} onReport={onReport}/>
    </div>
    </div>
  </section>;
}
