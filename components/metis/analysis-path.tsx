'use client';

import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Copy, MessageSquarePlus, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { PromptInput, PromptInputTextarea, PromptInputActions } from '@/components/prompt-kit/prompt-input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Spinner } from '@/components/ui/spinner';
import { PathNodeEditor, type PathNodeEditorTarget } from './path-node-editor';
import { maxUserPathNodes, userPathGraph, type UserPathNode } from '@/lib/metis/user-analysis-path';
import { usePathDiscussion } from './path-discussion';
import { currentPathUpdates, downstreamPathNodes } from '@/lib/metis/path-reasoning';
import { cn } from '@/lib/utils';
import { experimentPlans, pathColors, pathColumns, type ExperimentPlan, type PathNode } from '@/lib/metis/bebop-analysis-path';
import { analysisPathLayout, relatedPathNodes } from '@/lib/metis/analysis-path-layout';

const statusLabels={confirmed:'已核查',pending:'待解释',experiment:'待实验'};
const statusTones={confirmed:'positive',pending:'caution',experiment:'neutral'};
type Checks=Record<string,Record<string,boolean>>;
const storageKey='bebop-experiment-actions-v1';
const emptyCustomNodes:UserPathNode[]=[];

function readChecks():Checks {
  try {
    const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');
    if(saved&&typeof saved==='object'&&!Array.isArray(saved))return saved;
  } catch { /* Keep the checklist available without browser storage. */ }
  return {};
}

function ExperimentPlanContent({id,plan,checks,onChecksChange,onCloseFocus}:{id:string;plan:ExperimentPlan;checks:Checks;onChecksChange:(checks:Checks)=>void;onCloseFocus:()=>void}) {
  const [feedback,setFeedback]=useState('');
  const [copied,setCopied]=useState(false);
  const checked=(actionId:string)=>checks[id]?.[actionId]===true;
  const toggle=(actionId:string,value:boolean)=>{
    const next={...checks,[id]:{...checks[id],[actionId]:value}};
    onChecksChange(next);
    setCopied(false);
    try {localStorage.setItem(storageKey,JSON.stringify(next));setFeedback('进度已保存');}
    catch {setFeedback('进度仅在本次访问中保留');}
  };
  const copy=async()=>{
    const text=`${plan.title} · 发起实验\n${plan.actions.map(action=>`${checked(action.id)?'[x]':'[ ]'} ${action.text}`).join('\n')}`;
    try {await navigator.clipboard.writeText(text);setCopied(true);setFeedback('实验准备清单已复制，可粘贴到实验平台发起实验');}
    catch {setFeedback('复制未成功，可选中实验准备清单手动复制');}
  };
  return <DialogContent className="metis-viz max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-5xl" onCloseAutoFocus={event=>{event.preventDefault();onCloseFocus();}}>
    <DialogHeader className="border-b p-6 pr-12">
      <DialogTitle>{plan.title}</DialogTitle>
      <DialogDescription>{plan.subtitle}</DialogDescription>
    </DialogHeader>
    <div className="grid min-h-0 overflow-y-auto md:grid-cols-2" style={{maxHeight:'calc(100dvh - 14rem)'}}>
      <div className="space-y-6 p-6">
        <Badge variant="secondary" className="h-auto whitespace-normal text-left">{plan.hypothesis}</Badge>
        <dl className="space-y-5 text-sm leading-relaxed">
          <div><dt className="mb-1.5 font-medium">验证假设</dt><dd className="text-muted-foreground">{plan.premise}</dd></div>
          <div><dt className="mb-1.5 font-medium">实验改动 <span className="ml-2 text-xs font-normal text-muted-foreground">PPT 第 4 页</span></dt><dd className="text-muted-foreground">{plan.change}</dd></div>
          <div><dt className="mb-1.5 font-medium">对照方式 <span className="ml-2 text-xs font-normal text-muted-foreground">建议</span></dt><dd className="text-muted-foreground">{plan.comparison}</dd></div>
          <div><dt className="mb-2 font-medium">观察指标 <span className="ml-2 text-xs font-normal text-muted-foreground">建议</span></dt><dd className="flex flex-wrap gap-2">{plan.metrics.map(metric=><Badge variant="outline" key={metric}>{metric}</Badge>)}</dd></div>
        </dl>
        <Separator/>
        <section className="space-y-4" aria-label="实验准备清单">
          <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">发起实验</h3><span className="text-xs tabular-nums text-muted-foreground">{plan.actions.filter(action=>checked(action.id)).length} / {plan.actions.length}</span></div>
          {plan.actions.map(action=><div key={action.id} className="flex items-start gap-3">
            <Checkbox id={`path-${id}-${action.id}`} checked={checked(action.id)} onCheckedChange={value=>toggle(action.id,value===true)} className="mt-0.5"/>
            <Label htmlFor={`path-${id}-${action.id}`} className={cn('cursor-pointer text-sm font-normal leading-relaxed',checked(action.id)&&'text-muted-foreground line-through')}>{action.text}</Label>
          </div>)}
        </section>
      </div>
      <section className="space-y-5 border-t bg-muted/30 p-6 md:border-t-0 md:border-l" aria-label="截图 Demo">
        <h3 className="text-sm font-semibold">截图 Demo</h3>
        <div className="flex items-start justify-center gap-4">{plan.demos.map(demo=><figure key={demo.file} className="min-w-0 max-w-56 flex-1 space-y-3">
          <a href={`/cases/bebop/experiments/${demo.file}`} target="_blank" rel="noreferrer" className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`查看原图：${demo.label}`}>
            <img src={`/cases/bebop/experiments/${demo.file}`} alt={demo.alt} className="h-auto w-full" loading="lazy"/>
          </a>
          <figcaption className="text-center text-xs leading-relaxed text-muted-foreground">{demo.label}</figcaption>
        </figure>)}</div>
        <p className="text-xs leading-relaxed text-muted-foreground">{plan.demoNote}</p>
      </section>
    </div>
    <DialogFooter className="items-center border-t px-6 py-4 sm:justify-between">
      <p className="text-xs text-muted-foreground" role="status">{feedback}</p>
      <Button onClick={()=>void copy()}>{copied?<Check/>:<Copy/>}{copied?'已复制':'复制实验清单'}</Button>
    </DialogFooter>
  </DialogContent>;
}

export function AnalysisPath() {
  const discussion=usePathDiscussion();
  const customNodes=discussion?.customNodes??emptyCustomNodes;
  const graph=useMemo(()=>userPathGraph(customNodes),[customNodes]);
  const [editor,setEditor]=useState<PathNodeEditorTarget|null>(null);
  const handoffFocus=useRef(false);
  const [commentNode,setCommentNode]=useState<string|null>(null);
  const [comments,setComments]=useState<Record<string,string>>({});
  const updates=useMemo(()=>currentPathUpdates(discussion?.revisions,customNodes),[discussion?.revisions,customNodes]);
  const pending=useMemo(()=>new Set(discussion?.busyNodeId?downstreamPathNodes(discussion.busyNodeId,customNodes):[]),[discussion?.busyNodeId,customNodes]);
  const root=useRef<HTMLDivElement>(null);
  const contents=useRef(new Map<string,HTMLSpanElement>());
  const buttons=useRef(new Map<string,HTMLButtonElement>());
  const [measurements,setMeasurements]=useState({width:640,heights:{} as Record<string,number>});
  const [pinned,setPinned]=useState<string|null>(null);
  const [hovered,setHovered]=useState<string|null>(null);
  const [focused,setFocused]=useState<string|null>(null);
  const [planId,setPlanId]=useState<string|null>(null);
  const [checks,setChecks]=useState<Checks>(readChecks);
  const active=commentNode??planId??pinned??hovered??focused;
  const related=useMemo(()=>relatedPathNodes(active,graph.edges),[active,graph]);
  const layout=useMemo(()=>analysisPathLayout(measurements.width,measurements.heights,graph.rounds,72),[measurements,graph]);
  const instance=useId().replace(/:/g,'');

  useLayoutEffect(()=>{
    let frame=0;
    const measure=()=>{
      const width=root.current?.clientWidth??640;
      const heights=Object.fromEntries([...contents.current].map(([id,element])=>[id,element.getBoundingClientRect().height]));
      setMeasurements(previous=>previous.width===width&&JSON.stringify(previous.heights)===JSON.stringify(heights)?previous:{width,heights});
    };
    const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);});
    if(root.current)observer.observe(root.current);
    contents.current.forEach(element=>observer.observe(element));
    measure();
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[graph]);

  const clear=()=>{setPinned(null);setHovered(null);setFocused(null);};
  const nodeButton=(node:PathNode,diagramTop:number)=>{
    const box=layout.boxes[node.id],isPlan=Boolean(experimentPlans[node.id]);
    const borderColor=active&&related.has(node.id)?node.color:undefined;
    const customNode=customNodes.find(item=>item.id===node.id);
    const revision=updates[node.id];
    const comment=comments[node.id]??'';
    const downstream=downstreamPathNodes(node.id,customNodes).length-1;
    const submit=()=>{
      if(!comment.trim()||discussion?.busy)return;
      if(discussion?.submit(node.id,comment.trim())){handoffFocus.current=true;setComments(previous=>({...previous,[node.id]:''}));setCommentNode(null);}
    };
    return <Popover key={node.id} open={commentNode===node.id} onOpenChange={open=>{setCommentNode(open?node.id:null);if(open)setPinned(node.id);}}>
    <PopoverTrigger asChild><Button ref={element=>{if(element)buttons.current.set(node.id,element);else buttons.current.delete(node.id);}}
      variant="outline" data-path-node={node.id} aria-pressed={pinned===node.id} aria-label={`评论节点 ${node.ref??''} ${node.title}`} data-revised={Boolean(revision)}
      className={cn('group absolute z-20 h-auto flex-col items-stretch justify-center whitespace-normal rounded-lg px-3 py-4 text-left font-normal transition-[opacity,box-shadow,border-color,background-color] motion-reduce:transition-none',
        node.type.includes('missing')&&'border-dashed',active&&!related.has(node.id)&&'opacity-30',
        pinned===node.id&&'ring-2 ring-ring/25')}
      style={{left:box.x,top:box.y-diagramTop,width:box.width,height:box.height,borderColor,backgroundColor:node.color?`color-mix(in srgb, ${node.color} ${active&&related.has(node.id)?12:7}%, var(--card))`:undefined}}
      onPointerEnter={event=>{if(event.pointerType!=='touch')setHovered(node.id);}} onPointerLeave={()=>setHovered(null)}
      onFocus={()=>setFocused(node.id)} onBlur={()=>setFocused(null)}
      >
      <span ref={element=>{if(element)contents.current.set(node.id,element);else contents.current.delete(node.id);}} className="flex w-full flex-col gap-2">
        <span className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground">{node.ref||'OBSERVED'}</span>
          {!revision&&node.status&&<Badge variant="secondary" className="viz-status px-1.5 py-0 text-[10px]" data-tone={statusTones[node.status]}>{statusLabels[node.status]}</Badge>}
          {pending.has(node.id)?<Spinner className="size-3.5" aria-label="正在重新推理"/>:revision?<Badge variant="secondary" className="viz-status px-1.5 py-0 text-[10px]" data-tone={revision.state==='supported'?'positive':'neutral'}>{revision.state==='supported'?'AI 更新':'待验证'}</Badge>:null}
          <MessageSquarePlus className="ml-auto size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-aria-pressed:opacity-100"/>
          {node.trend&&(node.trend==='↑'?<ArrowUp aria-label="上升" style={{color:node.color}}/>:<ArrowDown aria-label="下降" style={{color:node.color}}/>)}
        </span>
        <span className="whitespace-pre-line break-words text-sm font-medium leading-relaxed">{revision&&node.type!=='metric'?revision.conclusion:node.title}</span>
        {(revision&&node.type==='metric'||!revision&&node.detail)&&<span className="break-words text-xs leading-relaxed text-muted-foreground">{revision?revision.conclusion:node.detail}</span>}
      </span>
    </Button></PopoverTrigger>
    <PopoverContent side="bottom" align="start" sideOffset={8} collisionPadding={16} className="w-[380px] max-w-[calc(100vw-2rem)] space-y-3 rounded-2xl p-3" onOpenAutoFocus={event=>{event.preventDefault();document.getElementById(`${instance}-${node.id}-comment`)?.focus();}} onCloseAutoFocus={event=>{event.preventDefault();if(!handoffFocus.current&&!planId&&!editor)buttons.current.get(node.id)?.focus();handoffFocus.current=false;}} onKeyDown={event=>event.stopPropagation()}>
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="min-w-0"><p className="text-xs text-muted-foreground">{node.ref??'OBSERVED'} · {downstream?`关联 ${downstream} 个下游节点`:'当前节点'}</p><p className="mt-1 text-sm font-medium">{node.title}</p></div>
        {customNode&&<Button variant="ghost" size="sm" disabled={discussion?.busy} onClick={()=>{handoffFocus.current=true;setCommentNode(null);setEditor({roundId:customNode.roundId,kind:customNode.kind,node:customNode});}}><Pencil/>编辑</Button>}
        {isPlan&&<Button variant="ghost" size="sm" onClick={()=>{setCommentNode(null);setPlanId(node.id);}}>实验计划<ArrowUpRight/></Button>}
      </div>
      {revision&&<Collapsible className="px-1 text-sm"><CollapsibleTrigger asChild><Button variant="link" size="sm" className="h-auto p-0">查看推理与原始结论</Button></CollapsibleTrigger><CollapsibleContent className="space-y-2 pt-2"><p>{revision.reasoning}</p><p className="text-muted-foreground">原始：{node.title}{node.detail?` · ${node.detail}`:''}</p></CollapsibleContent></Collapsible>}
      <PromptInput value={comment} onValueChange={value=>setComments(previous=>({...previous,[node.id]:value}))} onSubmit={submit} maxHeight={160} className="flex items-end gap-1 shadow-none">
        <PromptInputTextarea id={`${instance}-${node.id}-comment`} aria-label={`评论 ${customNode?node.title:node.ref??node.title}`} placeholder="添加评论，重新推理…" maxLength={8000} className="min-w-0 flex-1 text-sm"/>
        <PromptInputActions className="pb-1"><Button size="icon" disabled={!comment.trim()||discussion?.busy||!discussion} onClick={submit} aria-label="发送评论并重新推理"><ArrowUp/></Button></PromptInputActions>
      </PromptInput>
    </PopoverContent>
    </Popover>;
  };

  return <><Dialog open={Boolean(planId)} onOpenChange={open=>{if(!open)setPlanId(null);}}>
    <section className="min-w-0 space-y-4" aria-labelledby={`${instance}-title`} onKeyDown={event=>{if(event.key==='Escape'&&!planId){event.stopPropagation();clear();}}}>
      <h2 id={`${instance}-title`} className="text-lg font-semibold">Analysis path</h2>
      <ScrollArea className="w-full min-w-0 pb-3">
        <div ref={root} className="relative min-w-[640px]" style={{height:layout.height}} onClick={event=>{if(!(event.target as HTMLElement).closest('[data-path-node]'))clear();}}>
          {graph.rounds.map(round=>{
            const position=layout.rounds[round.id];
            return <section key={round.id} aria-labelledby={`${instance}-${round.id}`} className="absolute inset-x-0" style={{top:position.top,height:position.height}}>
              <Card className="h-full gap-0 py-0 shadow-none">
                <CardHeader className="relative z-20 flex h-16 shrink-0 flex-col items-start justify-center px-5 py-0">
                  <CardTitle><h3 id={`${instance}-${round.id}`} className="text-base">{round.title}</h3></CardTitle>
                </CardHeader>
                <div className="relative h-10 shrink-0 text-xs font-medium text-muted-foreground">
                  {Object.entries(pathColumns).map(([key,column],index)=><span key={key} className="absolute top-3" style={{left:`${column.x}%`}}>{['观察','假设','检验'][index]} <span className="ml-1 text-[10px] font-normal">{['Observe','Hypothesize','Test'][index]}</span></span>)}
                </div>
                <CardContent className="relative px-0" style={{height:position.diagramHeight}}>
                  {round.nodes.map(node=>nodeButton(node,position.diagramTop))}
                  {(['observation','hypothesis'] as const).map(kind=><Button key={kind} variant="outline" size="sm" className="absolute z-20 h-9 border-dashed bg-card/80 text-muted-foreground" style={{left:`${pathColumns[kind].x}%`,width:`${pathColumns[kind].w}%`,top:position.diagramHeight-60}} aria-label={`${round.title}：新增${kind==='observation'?'观察':'假设'}`} disabled={!discussion||discussion.busy||customNodes.length>=maxUserPathNodes} onClick={()=>{clear();setEditor({roundId:round.id as UserPathNode['roundId'],kind});}}><Plus className="size-4"/>{kind==='observation'?'新增观察':'新增假设'}</Button>)}
                  {round.notes?.map(note=><p key={note.text} className="absolute text-xs leading-relaxed text-muted-foreground" style={{left:'62%',width:'33.7%',top:note.y}}>— {note.text}</p>)}
                </CardContent>
              </Card>
            </section>;
          })}
          <svg className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
            <defs>{Object.entries(pathColors).map(([name,color])=><marker key={name} id={`${instance}-arrow-${name}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 1 1 L 8 5 L 1 9" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></marker>)}</defs>
            {layout.routes.map((route,index)=>{
              const highlighted=Boolean(active)&&route.from.some(id=>related.has(id))&&related.has(route.to);
              return <g key={index} opacity={active&&!highlighted?0.08:1} className="transition-opacity motion-reduce:transition-none" data-path-from={route.from.join(' ')} data-path-to={route.to}>
                <path d={route.d} fill="none" stroke="var(--card)" strokeWidth="6"/>
                <path d={route.d} fill="none" stroke={pathColors[route.color]} strokeWidth={highlighted?2.4:1.5} strokeDasharray={route.continuation&&!highlighted?'5 4':undefined} strokeLinecap="round" strokeLinejoin="round" markerEnd={route.arrow?`url(#${instance}-arrow-${route.color})`:undefined}/>
                {route.dots?.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="2.2" fill={pathColors[route.color]}/>)}
              </g>;
            })}
          </svg>
        </div>
        <ScrollBar orientation="horizontal"/>
      </ScrollArea>
      <span className="sr-only" aria-live="polite">{pinned?`已高亮 ${graph.nodes.find(node=>node.id===pinned)?.title} 的跨轮路径`:'已显示全部连线'}</span>
    </section>
    {planId&&<ExperimentPlanContent key={planId} id={planId} plan={experimentPlans[planId]} checks={checks} onChecksChange={setChecks} onCloseFocus={()=>buttons.current.get(planId)?.focus()}/>}
  </Dialog>
    {editor&&discussion&&<PathNodeEditor key={editor.node?.id??`${editor.roundId}-${editor.kind}`} target={editor} round={graph.rounds.find(round=>round.id===editor.roundId)!} busy={discussion.busy} onSave={node=>{const saved=discussion.saveNode(node);if(saved)setPinned(node.id);return saved;}} onRemove={id=>{discussion.removeNode(id);clear();}} onClose={()=>setEditor(null)}/>}
  </>;
}
