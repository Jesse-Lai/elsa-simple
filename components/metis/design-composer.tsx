'use client';
import { Button } from '@/components/ui/button';
import { PromptInput, PromptInputTextarea } from '@/components/prompt-kit/prompt-input';
import type { Draft } from './assistant';
import { DesignIcon } from './design-assets';

export function DesignComposer({ draft, busy, onDraftChange, onSend }: {
  draft: Draft; busy: boolean; onDraftChange: (draft: Draft) => void; onSend: (text: string, ids: string[]) => void;
}) {
  const send = () => { if (draft.text.trim() && !busy) onSend(draft.text, draft.evidenceIds); };
  return <div className="flex w-full justify-center px-8 pb-7" data-node-id="189:5566">
    <PromptInput value={draft.text} onValueChange={text => onDraftChange({...draft, text})} onSubmit={send}
      className="flex min-h-[58px] w-full max-w-[768px] items-center gap-3 rounded-3xl border-[#e4e4e7] py-2 pr-2 pl-5 shadow-[0_1px_2px_#00000014] [&_button]:rounded-[14px]">
      <PromptInputTextarea aria-label="Ask ELSA" placeholder="Ask a question, follow a hunch…" className="min-h-5 flex-1 p-0 text-sm leading-5 md:text-sm"/>
      <Button aria-label="Send question" onClick={send} disabled={busy || !draft.text.trim()} className="size-9 shrink-0 rounded-[14px] bg-[#a1a1aa] p-0 disabled:opacity-100"><DesignIcon file="24f2e"/></Button>
    </PromptInput>
  </div>;
}
