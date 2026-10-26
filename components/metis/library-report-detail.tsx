'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { libraryReportDetails, libraryReports, type ReportMetric } from '@/lib/metis/library-reports';
import styles from './library-report-detail.module.css';

function format(value: number, unit: string) {
  return unit === '$' ? `$${value.toFixed(2)}` : `${Number(value.toFixed(2))}${unit}`;
}

function MetricChart({ metric }: { metric: ReportMetric }) {
  const max = Math.max(metric.control, metric.treatment) * 1.25;
  return <figure className={styles.metric} aria-label={`${metric.name}: Control ${format(metric.control, metric.unit)}, Treatment ${format(metric.treatment, metric.unit)}; ${metric.change}`}>
    <figcaption>{metric.name}</figcaption>
    <p className={styles.change} data-tone={metric.tone}>{metric.change}</p>
    <div className={styles.barPlot}>
      {[metric.control, metric.treatment].map((value, index) => <div key={index} className={styles.barColumn}>
        <div className={styles.bar} data-treatment={index === 1} style={{ height: `${value / max * 100}%` }}><span>{format(value, metric.unit)}</span></div>
      </div>)}
    </div>
    <div className={styles.barLabels}><span>Control</span><span>Treatment</span></div>
  </figure>;
}

export function LibraryReportDetail({ report }: { report: typeof libraryReports[number] }) {
  const detail = libraryReportDetails[report.id];
  return <div className={styles.viewport}>
    <article className={styles.report} aria-labelledby="library-report-title">
      <header className={styles.heading}>
        <div className={styles.metadata}><Badge variant="secondary">Sample report</Badge><span>{report.date}</span></div>
        <h1 id="library-report-title">{report.title}</h1>
        <p>Sep 1–14, 2026 · 24,000 users per group · Mock data</p>
      </header>
      <section className={styles.summary} aria-label="Report summary"><h2>{detail.headline}</h2><p>{detail.takeaway}</p></section>
      <section className={styles.section} aria-labelledby="report-metrics"><div className={styles.sectionHeading}><h2 id="report-metrics">Key metrics</h2><div className={styles.legend}><span><i/>Control</span><span><i/>Treatment</span></div></div>
        <div className={styles.metrics}>{detail.metrics.map(metric => <MetricChart key={metric.name} metric={metric}/>)}</div>
      </section>
      <div className={styles.charts}>
        <section className={styles.section} aria-labelledby="report-trend"><h2 id="report-trend">{detail.trendLabel}</h2>
          <div className={styles.trend} role="img" aria-label={`${detail.trendLabel}, Sep 1 to Sep 14. Control and treatment daily values are listed in the accessible table.`}>
            <ResponsiveContainer width="100%" height="100%"><LineChart data={detail.trend} margin={{ top: 20, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#ededf0"/><XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={20} tick={{ fontSize: 11 }}/><YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} width={46} tick={{ fontSize: 11 }} tickFormatter={value => format(Number(value), detail.trendUnit)}/><Tooltip formatter={value => format(Number(value), detail.trendUnit)}/>
              <Line name="Control" type="linear" dataKey="control" stroke="#b3becb" strokeWidth={2} dot={false} isAnimationActive={false}/><Line name="Treatment" type="linear" dataKey="treatment" stroke="#008cff" strokeWidth={2} dot={false} isAnimationActive={false}/>
            </LineChart></ResponsiveContainer>
          </div>
          <table className="sr-only"><caption>{detail.trendLabel}</caption><thead><tr><th>Date</th><th>Control</th><th>Treatment</th></tr></thead><tbody>{detail.trend.map(point => <tr key={point.day}><td>{point.day}</td><td>{format(point.control, detail.trendUnit)}</td><td>{format(point.treatment, detail.trendUnit)}</td></tr>)}</tbody></table>
        </section>
        <section className={styles.section} aria-labelledby="report-segments"><h2 id="report-segments">Where the lift comes from</h2><p className={styles.note}>{detail.segmentNote}</p><div className={styles.segments}>{detail.segments.map(segment => <div key={segment.name}><div className={styles.segmentLabel}><span>{segment.name}</span><strong>+{segment.lift}%</strong></div><div className={styles.segmentTrack}><div style={{ width: `${segment.lift / 8 * 100}%` }}/></div></div>)}</div><p className={styles.note}>Observed segment differences do not establish a causal explanation.</p></section>
      </div>
      <section className={styles.section} aria-labelledby="report-findings"><h2 id="report-findings">Findings & next steps</h2><div className={styles.findings}>{detail.findings.map(finding => <div key={finding.title} className={styles.finding}><div><h3>{finding.title}</h3><p>{finding.detail}</p></div><div className={styles.next}><span>Next step</span><p>{finding.next}</p></div></div>)}</div></section>
      <p className={styles.footnote}>Illustrative data for this report demo. Confidence intervals and significance tests are not available.</p>
    </article>
  </div>;
}
