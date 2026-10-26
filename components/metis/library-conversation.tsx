'use client';

import { useState } from 'react';
import { ChatContainerRoot, ChatContainerContent } from '@/components/prompt-kit/chat-container';
import { Message, MessageContent } from '@/components/prompt-kit/message';
import { ScrollButton } from '@/components/prompt-kit/scroll-button';
import { PromptSuggestion } from '@/components/prompt-kit/prompt-suggestion';
import { Button } from '@/components/ui/button';
import { AssistantComposer, type Draft } from './assistant';
import { PathDiscussionProvider } from './path-discussion';
import { datasets } from '@/lib/metis/datasets';
import { libraryReports } from '@/lib/metis/library-reports';
import { mockConversationReply } from '@/lib/metis/mock-conversation';
import styles from './library-conversation.module.css';

type Experiment = { id: string; name: string; assessment: string; stage: string };
type Source = { id: string; title: string; kind: 'experiment' | 'report' };
type Entry = { role: 'user' | 'assistant'; text: string; sources?: Source[] };

// Briefing for the current demo snapshots; mechanisms remain hypotheses.
const briefing: Entry = {
  role: 'assistant',
  text: 'Two experiments need attention before expanding rollout: Onboarding has a latency regression, and Bebop shows lower daily usage alongside more cancellations.\n\n**Onboarding refresh:** Latency is up **64 ms**, exceeding the 50 ms guardrail. Lower-end Android shows the largest increase.\n\n**Bebop design:** Message DAU is down **0.47 pp**, while Stop Generating is up **0.49 pp**. Keep rollout at **5%** until the regressions are better understood.\n\nI can break down Onboarding latency by device, or examine Bebop’s ZQ and non-ZQ cancellations. Either analysis can help narrow down the next experiment.',
};
const nextQuestions = ['Analyze Onboarding latency', 'Investigate Bebop cancellations'];

export function LibraryConversation({ experiments, active, onExperiment, onReport }: {
  experiments: Experiment[]; active: boolean; onExperiment: (id: string) => void; onReport: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>({ text: '', evidenceIds: [], nonce: 0 });
  const [messages, setMessages] = useState<Entry[]>([]);
  const [topic, setTopic] = useState<string | null>(null);
  const unique = experiments.filter((item, index) => experiments.findIndex(other => other.id === item.id) === index);

  function send(text: string) {
    const prompt = text.trim();
    if (!prompt) return;
    const lower = prompt.toLowerCase();
    const named = unique.find(item => lower.includes(item.name.toLowerCase()) || lower.includes(item.id) || lower.includes(item.name.split(' ')[0].toLowerCase()));
    const reportsRequested = /report|报告|revenue|收入|营收|engagement|参与度/i.test(prompt);
    const overview = /overview|all experiments|which experiments|attention|概览|所有实验|哪些实验|关注/i.test(prompt);
    const followup = /\bit\b|\bits\b|\bthat\b|\bnext\b|\bwhy\b|它|这个|继续|下一步|为什么/i.test(prompt);
    const selected = named ?? (followup && !reportsRequested && !overview ? unique.find(item => item.id === topic) : undefined);
    let reply: Entry;
    if (reportsRequested) {
      const revenue = /revenue|收入|营收/i.test(prompt);
      const engagement = /engagement|参与度/i.test(prompt);
      const reports = libraryReports.filter(report => revenue ? report.id.includes('revenue') : engagement ? report.id.includes('engagement') : true);
      reply = { role: 'assistant', text: reports.map(report => `**${report.title}**\n${report.summary}`).join('\n\n'), sources: reports.map(report => ({ id: report.id, title: report.title, kind: 'report' })) };
      setTopic(null);
    } else if (selected) {
      const dataset = datasets.find(item => item.experiment.id === selected.id);
      reply = { role: 'assistant', text: dataset ? mockConversationReply(prompt, dataset).text : `**${selected.name}** is at ${selected.stage}. Detailed analysis is not available for this experiment yet.`, sources: dataset ? [{ id: selected.id, title: selected.name, kind: 'experiment' }] : [] };
      setTopic(selected.id);
    } else {
      const attention = /attention|risk|hold|关注|风险|暂停/i.test(prompt);
      const ready = /ready|ship|上线|发布/i.test(prompt);
      const shown = unique.filter(item => attention ? ['Needs attention', 'Don’t expand rollout'].includes(item.assessment) : ready ? item.assessment === 'Ready to ship' : true);
      reply = { role: 'assistant', text: `${attention ? 'These experiments need attention:' : ready ? 'Ready for the next rollout step:' : 'Here’s the current experiment overview:'}\n\n${shown.map(item => `- **${item.name}** — ${item.assessment || 'Running'}, ${item.stage}.`).join('\n')}\n\n${attention || ready ? 'Open an experiment to review the evidence.' : 'Ask about an experiment or the engagement and revenue reports.'}`, sources: shown.filter(item => datasets.some(dataset => dataset.experiment.id === item.id)).map(item => ({ id: item.id, title: item.name, kind: 'experiment' })) };
      setTopic(null);
    }
    setMessages(previous => [...previous, { role: 'user', text: prompt }, reply]);
    setDraft(previous => ({ text: '', evidenceIds: [], nonce: previous.nonce + 1 }));
  }

  return <aside className={styles.panel} aria-label="Experiment assistant">
    <header className={styles.header}>Experiment assistant</header>
    <PathDiscussionProvider value={null}>
      <ChatContainerRoot className="relative min-h-0 flex-1">
        <ChatContainerContent className="gap-6 p-4 md:p-6">
          {[briefing, ...messages].map((message, index) => <Message key={index} data-message-role={message.role} className={message.role === 'user' ? 'justify-end' : undefined}>
            <div className={message.role === 'user' ? 'min-w-0 max-w-[88%] space-y-3' : 'min-w-0 flex-1 space-y-3'}>
              <MessageContent markdown className={message.role === 'user' ? 'max-w-full min-w-0 rounded-2xl bg-muted px-4 py-3' : 'max-w-full min-w-0 rounded-none bg-transparent p-0'}>{message.text}</MessageContent>
              {message.sources && <div className="flex flex-col items-start gap-1">{message.sources.map(source => <Button key={source.id} variant="link" size="sm" className="h-auto max-w-full justify-start whitespace-normal px-0 text-left" onClick={() => source.kind === 'experiment' ? onExperiment(source.id) : onReport(source.id)}>{source.title}</Button>)}</div>}
            </div>
          </Message>)}
        </ChatContainerContent>
        <ScrollButton className="absolute bottom-4 left-1/2 -translate-x-1/2" aria-label="Scroll to latest message"/>
      </ChatContainerRoot>
      <div className="space-y-3 p-4">
        {messages.length === 0 && <div className="flex flex-wrap gap-2">{nextQuestions.map(text => <PromptSuggestion key={text} size="sm" className="h-auto max-w-full whitespace-normal py-2 text-left" onClick={() => send(text)}>{text}</PromptSuggestion>)}</div>}
        <AssistantComposer compact active={active} draft={draft} busy={false} onDraftChange={setDraft} onSend={send} onStop={() => {}}/>
      </div>
    </PathDiscussionProvider>
  </aside>;
}
