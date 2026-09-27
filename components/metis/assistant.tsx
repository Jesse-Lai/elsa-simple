'use client';
import { ArrowUp, ArrowUpRight, BookOpen, ChevronDown, FileText, GitBranch, Plus, RotateCcw, X, Square, AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ChatContainerRoot, ChatContainerContent } from '@/components/prompt-kit/chat-container';
import { Message, MessageContent } from '@/components/prompt-kit/message';
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from '@/components/prompt-kit/prompt-input';
import { Tool } from '@/components/prompt-kit/tool';
import { ScrollButton } from '@/components/prompt-kit/scroll-button';
import { PromptSuggestion } from '@/components/prompt-kit/prompt-suggestion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions } from '@/components/ui/item';
import { usePathDiscussion } from './path-discussion';
import { userPathGraph } from '@/lib/metis/user-analysis-path';
import { useExperimentData } from './experiment-data';
import type { AnalysisBranch, AgentSuggestion } from '@/lib/metis/types';

export type Draft = { text: string; evidenceIds: string[]; nonce: number };
type Props = {
  branch: AnalysisBranch; connected: boolean; busy: boolean; stage: string; error: string; draft: Draft;
  onDraftChange: (draft: Draft) => void; active: boolean;
  onSend: (text: string, ids: string[]) => void; onStop: () => void; onRetry: () => void;
  onEvidence: (id: string) => void; onSuggestion: (s: AgentSuggestion) => void;
  onReport: () => void; onSetup: () => void;
};

type ComposerProps = Pick<Props, 'draft' | 'busy' | 'onDraftChange' | 'onSend' | 'onStop'> & { compact?: boolean; active?: boolean };

export function AssistantComposer({draft,busy,onDraftChange,onSend,onStop,compact=false,active=true}:ComposerProps) {
  const composerRef=useRef<HTMLDivElement>(null);
  const discussion=usePathDiscussion();
  const {nodeById:pathNodeById}=userPathGraph(discussion?.customNodes);
  const focusNode=discussion?.focusId?pathNodeById[discussion.focusId]:undefined;
  useEffect(()=>{
    if(active && !compact && draft.nonce)composerRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')?.focus();
  },[draft.nonce,active,compact]);
  const submit = () => {
    if (!draft.text.trim() || busy) return;
    onSend(draft.text.trim(), draft.evidenceIds);
  };
  return <div ref={composerRef} className="space-y-3">
    {focusNode&&<div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"><div className="min-w-0 text-xs"><span className="text-muted-foreground">继续推理 · </span><span>{focusNode.ref??'OBSERVED'} · {focusNode.title}</span></div><Button variant="ghost" size="icon-sm" className="shrink-0" onClick={()=>discussion?.focus(undefined)} aria-label="结束节点讨论"><X/></Button></div>}
    {draft.evidenceIds.length > 0 && <div className="flex items-center justify-between gap-2"><Badge variant="secondary">{draft.evidenceIds.length} evidence item{draft.evidenceIds.length > 1 ? 's' : ''} attached</Badge><Button variant="ghost" size="icon-sm" onClick={() => onDraftChange({...draft,evidenceIds:[]})} aria-label="Remove evidence context"><X/></Button></div>}
    <PromptInput value={draft.text} onValueChange={text=>onDraftChange({...draft,text})} onSubmit={submit} isLoading={busy} maxHeight={150} data-testid="chat-composer" className={compact ? 'flex items-center gap-2' : undefined} onClick={compact ? event=>event.currentTarget.querySelector('input')?.focus() : undefined}>
      {compact ? <Input
        aria-label="Ask ELSA"
        placeholder="Ask a question, follow a hunch…"
        value={draft.text.replace(/[\r\n]+/g, ' ')}
        onChange={event=>onDraftChange({...draft,text:event.target.value})}
        onKeyDown={event=>{
          if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing&&event.keyCode!==229){event.preventDefault();submit();}
        }}
        className="h-10 flex-1 border-0 text-primary shadow-none focus-visible:ring-0"
      /> : <PromptInputTextarea aria-label="Ask ELSA" placeholder="Ask a question, follow a hunch…"/>}
      <PromptInputActions className={compact ? 'shrink-0' : 'justify-end p-2'}>
        <PromptInputAction tooltip={busy ? 'Stop response' : 'Send message'}><Button type="button" size="icon" disabled={!busy && !draft.text.trim()} aria-label={busy ? 'Stop response' : 'Send message'} onClick={busy ? onStop : submit}>{busy ? <Square/> : <ArrowUp/>}</Button></PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  </div>;
}

export function AssistantPanel({ branch, connected, busy, stage, error, draft, onDraftChange, active, onSend, onStop, onRetry, onEvidence, onSuggestion, onReport, onSetup }: Props) {
  const {evidenceById,metricById,caseStudy}=useExperimentData();
  const discussion=usePathDiscussion();
  const {nodeById:pathNodeById}=userPathGraph(discussion?.customNodes);

  return <aside className="flex h-full min-h-0 min-w-0 flex-col" aria-label="Experiment conversation">
    <ChatContainerRoot key={branch.id} className="relative min-h-0 flex-1">
      <ChatContainerContent className="gap-6 p-4 md:p-6">
        {branch.messages.map(message => <Message key={message.id}>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">{message.origin==='source'?'Case notes':message.role==='assistant'?'ELSA':'You'}{message.origin==='source'&&<Badge variant="outline">Source reconstruction</Badge>}{message.role==='assistant'&&message.origin==='demo'&&<Badge variant="outline">Prepared demo</Badge>}</div>
            {message.pathNodeId&&pathNodeById[message.pathNodeId]&&<Badge variant="outline" className="h-auto max-w-full whitespace-normal text-left">{pathNodeById[message.pathNodeId].ref??'OBSERVED'} · {pathNodeById[message.pathNodeId].title}</Badge>}
            {message.tools?.map((tool, i) => <Tool key={i} toolPart={{ type: tool, state: 'output-available', output: { Source: 'Fixed experiment snapshot', Scope: caseStudy?'Supplied case records, sources and hypotheses':'Metrics, trends and platform segments' } }} />)}
            <MessageContent markdown className="max-w-full min-w-0">{message.text || (message.pathNodeId&&message.status==='incomplete'&&!busy?'本次推理未完成，原有节点结果已保留。':'Reading the evidence…')}</MessageContent>
            {message.pathRevisionId&&(()=>{
              const revision=discussion?.revisions.find(item=>item.id===message.pathRevisionId);
              return revision?<Collapsible className="rounded-lg border p-3"><CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="h-auto w-full justify-between whitespace-normal text-left">已更新 {revision.updates.length} 个节点<ChevronDown/></Button></CollapsibleTrigger><CollapsibleContent className="space-y-3 pt-3"><p className="text-sm">{revision.summary}</p>{revision.updates.map(update=><div key={update.nodeId} className="space-y-1 border-t pt-3 text-sm"><p className="font-medium">{pathNodeById[update.nodeId]?.ref??pathNodeById[update.nodeId]?.title}</p><p>{update.conclusion}</p><p className="text-xs text-muted-foreground">{update.reasoning}</p></div>)}</CollapsibleContent></Collapsible>:null;
            })()}
            {message.status === 'incomplete' && !busy && <Badge variant="outline">Response incomplete</Badge>}
            {message.evidenceIds.length > 0 && <Collapsible>
              <CollapsibleTrigger asChild><Button variant="ghost" size="sm"><BookOpen/>{message.evidenceIds.length} evidence source{message.evidenceIds.length > 1 ? 's' : ''}<ChevronDown/></Button></CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col items-start gap-1 pt-2">{message.evidenceIds.filter(id => evidenceById[id]).map(id => <Button variant="link" size="sm" className="max-w-full" key={id} onClick={() => onEvidence(id)}><ArrowUpRight/><span className="truncate">{evidenceById[id].title}</span></Button>)}</CollapsibleContent>
            </Collapsible>}
            {message.id === 'welcome' && <Item variant="outline" size="sm" asChild><button onClick={onReport}><ItemMedia variant="icon"><FileText/></ItemMedia><ItemContent className="min-w-0 text-left"><ItemTitle>Experiment report</ItemTitle><ItemDescription>Summary, signals & next steps</ItemDescription></ItemContent><ItemActions><ArrowUpRight className="size-4"/></ItemActions></button></Item>}
            {message.suggestions?.map((suggestion, i) => <PromptSuggestion size="sm" className="h-auto max-w-full whitespace-normal text-left" key={i} onClick={() => onSuggestion(suggestion)}>{suggestion.kind === 'branch' ? <GitBranch/> : <Plus/>}{suggestion.title}<ArrowUpRight/></PromptSuggestion>)}
          </div>
        </Message>)}
        {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Spinner/>{stage || 'Thinking through the evidence…'}</div>}
      </ChatContainerContent>
      <ScrollButton className="absolute bottom-4 left-1/2 -translate-x-1/2" aria-label="Scroll to latest message"/>
    </ChatContainerRoot>
    {error && <div className="p-4"><Alert variant="destructive"><AlertCircle/><AlertDescription><p>{error}</p><Button variant="ghost" size="sm" onClick={connected ? onRetry : onSetup}><RotateCcw/>{connected ? 'Retry' : 'Connection details'}</Button></AlertDescription></Alert></div>}
    <div className="space-y-3 p-4">
      {branch.messages.length < 3 && !busy && <div className="flex flex-wrap gap-2">
        <PromptSuggestion size="sm" className="h-auto max-w-full whitespace-normal py-2 text-left" onClick={() => onDraftChange({text:caseStudy?'Why do both ZQ and non-ZQ cancellations regress?':`How does ${metricById.latency.name.toLowerCase()} vary by platform?`,evidenceIds:caseStudy?['segment:crashes']:['segment:latency'],nonce:Date.now()})}>{caseStudy?'Why do both cancel slices regress?':'Compare performance by platform'}</PromptSuggestion>
        <PromptSuggestion size="sm" className="h-auto max-w-full whitespace-normal py-2 text-left" onClick={() => onDraftChange({text:'What should we validate next?',evidenceIds:[],nonce:Date.now()})}>What should we validate next?</PromptSuggestion>
      </div>}
      <AssistantComposer active={active} draft={draft} busy={busy} onDraftChange={onDraftChange} onSend={onSend} onStop={onStop}/>
    </div>
  </aside>;
}
