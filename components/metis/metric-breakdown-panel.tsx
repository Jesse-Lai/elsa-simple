'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { breakdownMetrics, metricBreakdowns, formatReadout, formatChange, type BreakdownGroup, type BreakdownMetric, type Slice } from '@/lib/metis/metric-breakdowns';
import styles from './metric-breakdown-panel.module.css';

function Trend({ values, compact = false }: { values: number[]; compact?: boolean }) {
  const min = Math.floor(Math.min(...values) * 10) / 10 - (compact ? .05 : 1);
  const max = Math.max(...values) + (compact ? .05 : 1);
  const width = compact ? 100 : 440;
  const height = compact ? 32 : 176;
  const left = compact ? 3 : 40;
  const right = compact ? 3 : 16;
  const top = compact ? 3 : 14;
  const bottom = compact ? 3 : 26;
  const x = (i: number) => left + i / (values.length - 1) * (width - left - right);
  const y = (v: number) => top + (max - v) / (max - min) * (height - top - bottom);
  return <svg className={compact ? styles.sparkline : styles.trend} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={compact ? `Day 1 to day 7: ${values.join(', ')}` : `Daily trend: ${values.map((v, i) => `Day ${i + 1}: ${v}%`).join(', ')}`}>
    {!compact && <>{[max, (min + max) / 2, min].map(v => <g key={v}><line x1={left} y1={y(v)} x2={width - right} y2={y(v)} className={styles.gridLine}/><text x={left - 8} y={y(v) + 4} textAnchor="end">{Number(v.toFixed(1))}%</text></g>)}{values.map((_, i) => <text key={i} x={x(i)} y={height - 4} textAnchor="middle">D{i + 1}</text>)}</>}
    <polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth={compact ? 1.5 : 2} strokeLinejoin="round" strokeLinecap="round"/>
    {!compact && values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="currentColor"><title>Day {i + 1}: {v}%</title></circle>)}
  </svg>;
}

function SliceBars({ rows }: { rows: Slice[] }) {
  return <div className={styles.sliceBars}>{rows.map(row => <div key={row.label} className={styles.sliceRow}>
    <div className={styles.sliceLabel}><span>{row.label}</span><span>{formatReadout(row.value)}</span></div>
    <div className={styles.track}><div className={styles.bar} style={{ width: `${row.value}%` }}/></div>
  </div>)}<div className={styles.scale}><span>0%</span><span>100%</span></div></div>;
}

export function MetricBreakdownPanel() {
  const [metric, setMetric] = useState<BreakdownMetric>('early-sat');
  const [group, setGroup] = useState<BreakdownGroup>('treatment');
  const data = metricBreakdowns[metric][group];
  const name = breakdownMetrics.find(m => m.id === metric)!.name;
  return <section className={styles.card} aria-label="Metric breakdown" data-metric={metric} data-selected-group={group}>
    <div className={styles.controls}>
      <Tabs value={group} onValueChange={v => setGroup(v as BreakdownGroup)}><TabsList aria-label="Group to analyze" className={styles.tabs}><TabsTrigger value="treatment">Treatment</TabsTrigger><TabsTrigger value="control">Control</TabsTrigger></TabsList></Tabs>
      <Tabs value={metric} onValueChange={v => setMetric(v as BreakdownMetric)}><TabsList aria-label="Metric to investigate" className={styles.tabs}>{breakdownMetrics.map(m => <TabsTrigger key={m.id} value={m.id}>{m.name}</TabsTrigger>)}</TabsList></Tabs>
    </div>
    <div className={styles.context}><span>{name} · {group === 'treatment' ? 'Treatment' : 'Control'}</span><span>Day 1–7 · Illustrative data</span></div>
    <div className={styles.grid} key={`${metric}-${group}`}>
      <section className={styles.panel} aria-label="Daily trend"><h3>Daily trend</h3><div className={styles.readout}><strong>{formatReadout(data.daily.at(-1)!)}</strong><span>{formatChange(data.daily)} vs day 1</span></div><Trend values={data.daily}/></section>
      <section className={styles.panel} aria-label="User cohorts"><h3>User cohorts</h3><p className={styles.caption}>By user tenure</p><SliceBars rows={data.users}/></section>
      <section className={styles.panel} aria-label="Countries"><h3>Countries</h3><SliceBars rows={data.countries}/></section>
      <section className={styles.panel} aria-label="Related metrics"><div className={styles.panelHeading}><h3>Related metrics</h3><span>Δ vs day 1</span></div><div className={styles.related}>{data.related.map(row => <div className={styles.relatedRow} key={row.name}><div><span>{row.name}</span><strong>{formatReadout(row.values.at(-1)!, row.unit)}</strong></div><Trend values={row.values} compact/><span className={styles.delta}>{formatChange(row.values, row.unit)}</span></div>)}</div></section>
    </div>
  </section>;
}
