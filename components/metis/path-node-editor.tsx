'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AnalysisRound } from '@/lib/metis/bebop-analysis-path';
import type { UserPathNode } from '@/lib/metis/user-analysis-path';

export type PathNodeEditorTarget = { roundId: UserPathNode['roundId']; kind: UserPathNode['kind']; node?: UserPathNode };

export function PathNodeEditor({ target, round, busy, onSave, onRemove, onClose }: {
  target: PathNodeEditorTarget; round: AnalysisRound; busy: boolean;
  onSave: (node: UserPathNode) => boolean; onRemove: (id: string) => void; onClose: () => void;
}) {
  const id = useId();
  const [title, setTitle] = useState(target.node?.title ?? '');
  const [detail, setDetail] = useState(target.node?.detail ?? '');
  const [parentId, setParentId] = useState(target.node?.parentId ?? 'none');
  const noun = target.kind === 'observation' ? '观察' : '假设';
  const submit = () => {
    if (!title.trim() || busy) return;
    const node: UserPathNode = { id: target.node?.id ?? `custom-${crypto.randomUUID()}`, roundId: target.roundId, kind: target.kind, title: title.trim(), detail: detail.trim(), ...(target.kind === 'hypothesis' && parentId !== 'none' ? { parentId } : {}) };
    if (onSave(node)) onClose();
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>{target.node ? '编辑' : '新增'}{noun}</DialogTitle><DialogDescription>{round.title}</DialogDescription></DialogHeader>
      <form className="space-y-5" onSubmit={event => { event.preventDefault(); submit(); }}>
        <div className="space-y-2"><Label htmlFor={`${id}-title`}>{noun}内容</Label><Input id={`${id}-title`} autoFocus required maxLength={180} value={title} onChange={event => setTitle(event.target.value)} placeholder={target.kind === 'observation' ? '你观察到了什么？' : '什么可能解释这个现象？'}/></div>
        <div className="space-y-2"><Label htmlFor={`${id}-detail`}>补充说明 <span className="font-normal text-muted-foreground">（选填）</span></Label><Textarea id={`${id}-detail`} maxLength={600} value={detail} onChange={event => setDetail(event.target.value)} placeholder="补充数据、依据或待验证的问题" className="min-h-24"/></div>
        {target.kind === 'hypothesis' && <div className="space-y-2"><Label htmlFor={`${id}-parent`}>关联观察</Label><Select value={parentId} onValueChange={setParentId}><SelectTrigger id={`${id}-parent`} className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">暂不关联</SelectItem>{round.nodes.filter(node => node.column === 'observation').map(node => <SelectItem key={node.id} value={node.id}>{node.title}</SelectItem>)}</SelectContent></Select></div>}
        <DialogFooter className="gap-2">
          {target.node && <Button type="button" variant="ghost" className="mr-auto text-destructive hover:text-destructive" disabled={busy} onClick={() => { onRemove(target.node!.id); onClose(); }}>删除{noun}</Button>}
          <Button type="button" variant="outline" onClick={onClose}>取消</Button><Button type="submit" disabled={!title.trim() || busy}>{target.node ? '保存' : `添加${noun}`}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
