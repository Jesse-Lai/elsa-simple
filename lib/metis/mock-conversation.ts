import type { ChatMessage, ExperimentDataset } from './types';

// Local prototype replies use the selected experiment's prepared evidence.
export function mockConversationReply(prompt: string, dataset: ExperimentDataset, evidenceIds: string[] = []): Pick<ChatMessage, 'text' | 'evidenceIds' | 'origin' | 'status'> {
  const { demoReport: report } = dataset;
  const nextStep = /next|validat|action|下一步|验证|建议/i.test(prompt);
  const cancellation = /cancel|stop generation|取消|停止生成/i.test(prompt);
  const greeting = /^(hi|hello|hey|你好|嗨)[!！.。\s]*$/i.test(prompt.trim());
  const matched = report.findings.filter(finding =>
    finding.evidenceIds.some(id => evidenceIds.includes(id)) ||
    (cancellation && /cancel|取消/i.test(finding.title)) ||
    dataset.metrics.some(metric => prompt.toLowerCase().includes(metric.name.toLowerCase()) && finding.evidenceIds.includes(`metric:${metric.id}`))
  );
  const findings = matched.length ? matched : report.findings;
  const text = greeting
    ? `Hi! Let’s explore ${dataset.experiment.name}.\n\n${report.summary}\n\nWe can look at the metric changes, investigate a hypothesis, or plan the next validation.`
    : nextStep
      ? findings.slice(0, 3).map((finding, i) => `${i + 1}. **${finding.title}**\n${finding.validation}`).join('\n\n')
      : matched.length
        ? matched.slice(0, 2).map(finding => `**${finding.title}**\n${finding.body}\n\n**Hypothesis:** ${finding.hypothesis}\n\n**Next step:** ${finding.validation}`).join('\n\n')
        : `${report.summary}\n\n${findings[0]?.body ?? ''}\n\n**Next step:** ${findings[0]?.validation ?? 'Review the key metric changes.'}`;
  return { text, evidenceIds: [...new Set(findings.flatMap(f => f.evidenceIds))].filter(id => Boolean(dataset.evidenceById[id])), origin: 'demo', status: 'complete' };
}
