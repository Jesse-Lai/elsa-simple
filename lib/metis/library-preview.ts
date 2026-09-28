import { libraryDecision } from './library-overview';
import { absoluteChange, metricState, number, signed } from './metric-analysis';
import type { ExperimentDataset, Metric } from './types';

type PreviewEvidence = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone: 'positive' | 'caution' | 'neutral';
};

export function libraryPreview(data?: ExperimentDataset) {
  const decision = libraryDecision(data);
  const evidence: PreviewEvidence[] = [];
  if (!data) return { decision, conclusion: 'Connect experiment data to start an analysis.', evidence };

  if (data.caseStudy) {
    // Use the two risks from the same PPT summary, not mixed-window scorecards.
    for (const id of ['message-dau', 'stop-generating']) {
      const metric = data.caseStudy.metrics.find(item => item.id === id);
      if (metric) evidence.push({ id, label: metric.name, value: `${signed(metric.treatment - metric.control)} pp`, tone: 'caution' });
    }
    return { decision, conclusion: 'Hold at 5% recommended; usage and cancellation risks remain unresolved.', evidence };
  }

  const config = data.defaultConfig;
  const targets = data.metrics.filter(metric => config.roles[metric.id] === 'target');
  const guardrails = data.metrics.filter(metric => config.roles[metric.id] === 'guardrail');
  const breached = guardrails.find(metric => metricState(metric, config).tone === 'caution');
  const uncertain = guardrails.find(metric => metricState(metric, config).tone === 'neutral');
  const target = targets.find(metric => metricState(metric, config).tone !== 'positive') ?? targets[0];
  const unit = (metric: Metric) => metric.unit === '%' ? 'pp' : metric.unit;
  function addMetric(metric: Metric, detail?: string) {
    const tone = metricState(metric, config).tone;
    evidence.push({ id: metric.id, label: metric.name, value: absoluteChange(metric), detail, tone: tone === 'positive' || tone === 'caution' ? tone : 'neutral' });
  }
  if (target) {
    const interval = decision.status === 'continue' && target.ci
      ? `95% CI ${signed(target.ci[0])} to ${signed(target.ci[1])} ${unit(target)}` : undefined;
    addMetric(target, interval);
  }
  const risk = breached ?? uncertain;
  if (risk) addMetric(risk, `limit ${signed(config.thresholds[risk.id] * (risk.direction === 'down' ? 1 : -1), 3)} ${unit(risk)}`);

  const conclusion = breached ? decision.reason
    : uncertain ? `${uncertain.name} may exceed the guardrail; more evidence is needed.`
    : decision.status === 'ship' ? 'Primary target met; guardrails within limits.'
    : decision.status === 'continue' && target ? `The minimum useful gain of ${number(config.thresholds[target.id])} ${unit(target)} is not yet established.`
    : decision.reason;
  return { decision, conclusion, evidence };
}
