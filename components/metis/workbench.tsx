'use client';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Clipboard, Download, GitBranch, History, MoreHorizontal, RotateCcw, Settings2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemGroup } from '@/components/ui/item';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExperimentLibrary } from './experiment-library';
import { WorkbenchLayout } from './workbench-layout';
import { WorkspacePanel, type WorkspacePanelTab } from './workspace-panel';
import { ReportViewport } from './report-viewport';
import { ExperimentDemoPanel } from './experiment-demo';
import { getExperimentDemo } from '@/lib/metis/experiment-demos';
import { Configuration } from './start';
import { AssistantComposer, AssistantPanel, type Draft } from './assistant';
import { CaseEvidenceDialog } from './case-evidence-dialog';
import { EvidenceView, ReportView } from './report';
import { EvidenceChips } from './common';
import { DesignIcon } from './design-assets';
import { DesignAnalysisReport } from './design-analysis-report';
import { DesignAnalysisLayout } from './design-analysis-layout';
import { DesignComposer } from './design-composer';
import { initialWorkspace } from '@/lib/metis/data';
import { getDataset, seedWorkspace, sessionIdForExperiment } from '@/lib/metis/datasets';
import { ExperimentDataProvider } from './experiment-data';
import { reportReadout } from '@/lib/metis/report-copy';
import { addAction, createBranch, evidenceArtifact, exportReport, metricState, uid, updateBranch } from '@/lib/metis/domain';
import type { AgentEvent, AgentSuggestion, AnalysisBranch, AnalysisConfig, Artifact, Finding, Workspace, ExperimentDataset } from '@/lib/metis/types';

import { PathDiscussionProvider } from './path-discussion';
import { currentPathUpdates, downstreamPathNodes, isPathNode, validatePathResult, type PathRevision } from '@/lib/metis/path-reasoning';
import { userPathNodesSchema, removeUserPathNode, type UserPathNode } from '@/lib/metis/user-analysis-path';
import { normalizeAnalysisConfig } from '@/lib/metis/analysis-modes';
import { resolveSimpleView } from '@/lib/metis/simple-navigation';
import { mockConversationReply } from '@/lib/metis/mock-conversation';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { UserSettings } from './user-settings';
import { LibraryReportDetail } from './library-report-detail';
import { libraryReports } from '@/lib/metis/library-reports';

function subscribeReportLocation(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener('elsa-location-change', onChange);
  return () => { window.removeEventListener('popstate', onChange); window.removeEventListener('elsa-location-change', onChange); };
}
function getReportLocation() { return new URLSearchParams(window.location.search).get('report'); }
function notifyLocationChange() { window.dispatchEvent(new Event('elsa-location-change')); }

const STORAGE_KEY='elsa-simple-workspace-v1';
function ExperimentHeader({ name, library, home, connected, model }: { name: string; library: boolean; home: ()=>void; connected: boolean; model: string }) {
  const preferences = useUserPreferences();
  return <header className="flex h-16 min-h-16 shrink-0 items-center justify-between gap-6 border-b bg-white px-8">
    <nav aria-label="Main navigation" className="flex min-w-0 items-center gap-6">
      <Button variant="ghost" className="h-auto shrink-0 p-0 text-xl leading-7 font-semibold hover:bg-transparent" aria-label="ELSA — Experiment library" onClick={home}>ELSA</Button>
      {!library && <><Separator orientation="vertical" className="h-5!"/><Button variant="ghost" className="h-8 w-4 shrink-0 p-0 hover:bg-transparent" aria-label="Back to experiment library" onClick={home}><DesignIcon file="841ab"/></Button><span className="truncate text-sm leading-5">{name}</span></>}
    </nav>
    <UserSettings preferences={preferences} connected={connected} model={model}/>
  </header>;
}
type Busy={branchId:string;runId:string;messageId:string;mode:'chat'|'analyze';prompt:string;evidenceIds:string[];config:AnalysisConfig;pathNodeId?:string};
function configuredDemo(config:AnalysisConfig,dataset:ExperimentDataset){
  const {metrics,defaultConfig,demoReport}=dataset;
  if(dataset.caseStudy)return structuredClone(demoReport);
  const chosen=metrics.filter(m=>config.roles[m.id]!=='excluded');const harmful=chosen.filter(m=>config.roles[m.id]==='guardrail'&&metricState(m,config).tone==='caution');
  const uncertain=chosen.filter(m=>config.roles[m.id]==='guardrail'&&metricState(m,config).tone==='neutral');
  const targetMet=chosen.filter(m=>config.roles[m.id]==='target').every(m=>metricState(m,config).tone==='positive');
  const isDefault=JSON.stringify(config.roles)===JSON.stringify(defaultConfig.roles)&&JSON.stringify(config.thresholds)===JSON.stringify(defaultConfig.thresholds);
  const report=structuredClone(demoReport);if(!isDefault){report.headline=harmful.length?'The gains need to be weighed against risk.':targetMet?'The selected targets show a useful gain.':'More evidence is needed for this decision.';report.summary=`Under the selected thresholds, ${harmful.length?`${harmful.map(m=>m.name).join(' and ')} exceeds the guardrail.`:uncertain.length?`${uncertain.map(m=>m.name).join(' and ')} has an uncertain guardrail boundary.`:'the selected guardrails remain within their boundaries.'} ${targetMet?'The target metrics reach their minimum useful gains.':'Not all target metrics reach their minimum useful gains.'} This prepared readout covers the fixed demo evidence; connect AI to interpret your specific objective.`;report.recommendation=harmful.length?'iterate':targetMet&&!uncertain.length?'ship':'continue';report.findings=report.findings.filter(f=>f.evidenceIds.some(id=>chosen.some(m=>id.endsWith(`:${m.id}`))))}
  return report;
}
export function Workbench({initialExperimentId}:{initialExperimentId?:string}={}){
  const preferences = useUserPreferences();
  const reportId = useSyncExternalStore(subscribeReportLocation, getReportLocation, () => null);
  const libraryReport = libraryReports.find(report => report.id === reportId);
  const [workspace,setWorkspace]=useState<Workspace>(()=>{return resolveSimpleView(seedWorkspace(initialWorkspace()),initialExperimentId);});const stateRef=useRef(workspace);stateRef.current=workspace;
  const openLibrary=useCallback(()=>{if(window.location.pathname!=='/'||window.location.search)window.history.pushState(null,'','/');notifyLocationChange();setWorkspace(s=>({...s,view:'library'}));},[]);
  function openReport(id: string) { if (!libraryReports.some(report => report.id === id)) return; window.history.pushState(null, '', `/?report=${encodeURIComponent(id)}`); notifyLocationChange(); }
  const [loaded,setLoaded]=useState(false);const [connected,setConnected]=useState(false);const [model,setModel]=useState('gpt-5.6-terra');const [narrow,setNarrow]=useState(false);
  const [activeArtifacts,setActiveArtifacts]=useState<Record<string,string>>({});const returnReports=useRef<Record<string,string>>({});const [busy,setBusy]=useState<Busy|null>(null);const busyRef=useRef<Busy|null>(null);const abortRef=useRef<AbortController|null>(null);const [stage,setStage]=useState('');const [errors,setErrors]=useState<Record<string,string>>({});const retryRef=useRef<Busy|null>(null);
  const [draft,setDraft]=useState<Draft>({text:'',evidenceIds:[],nonce:0});const [settings,setSettings]=useState(false);const [setup,setSetup]=useState(false);const [history,setHistory]=useState(false);
  const [panels,setPanels]=useState<Record<string,{open:boolean;tab:WorkspacePanelTab}>>({});
  const [branchPicker,setBranchPicker]=useState(false);
  const [sourceEvidenceId,setSourceEvidenceId]=useState<string|null>(null);
  const [branchDialog,setBranchDialog]=useState<{sourceId:string;title:string;context:string;ids:string[]}|null>(null);
  const branch=workspace.branches.find(b=>b.id===workspace.selectedBranchId)??workspace.branches[0];
  const dataset=getDataset(branch.experimentId);
  const {experiment}=dataset;
  const experimentDemo=getExperimentDemo(experiment.id);
  const panel=panels[branch.id]??{open:experiment.id==='bebop-5pct'&&!narrow,tab:experimentDemo?preferences.defaultPanel:'conversation'};
  const chatOpen=panel.open&&panel.tab==='conversation';
  const experimentName=workspace.view==='library' ? 'Experiment library' : experiment.id==='bebop-5pct' ? 'Bebop design' : experiment.name;
  const lastReport=branch.artifacts.filter(a=>a.kind==='report').at(-1);const selected=activeArtifacts[branch.id]??lastReport?.id??'report';const artifact=branch.artifacts.find(a=>a.id===selected)??(selected==='report'?lastReport:undefined);
  const aiBusy=busy?.branchId===branch.id;
  const reportBranch = artifact?.kind === 'report' ? {...branch, config: artifact.config ?? branch.runs.find(r=>r.id===artifact.runId)?.config ?? branch.config} : branch;
  const refreshConnection=useCallback(async()=>{try{const res=await fetch('/api/experiment',{cache:'no-store'});const data=await res.json() as {aiConfigured:boolean;model:string};setConnected(Boolean(data.aiConfigured));setModel(data.model||'gpt-5.6-terra');}catch{setConnected(false);}},[]);
  useEffect(()=>{try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const saved=JSON.parse(raw) as Workspace;if(saved.version===1&&saved.branches?.length&&saved.branches.every(b=>b.config?.roles&&Array.isArray(b.messages)&&Array.isArray(b.artifacts)&&Array.isArray(b.runs)&&Array.isArray(b.actions))){if(saved.branches.some(b=>getDataset(b.experimentId).experiment.snapshotId!==b.snapshotId))throw new Error('Unsupported saved snapshot');saved.branches=saved.branches.map(b=>({...b,pathCustomNodes:userPathNodesSchema.catch([]).parse(b.pathCustomNodes??[]),config:normalizeAnalysisConfig(b.config),artifacts:b.artifacts.map(a=>({...a,...(a.config?{config:normalizeAnalysisConfig(a.config)}:{})})),runs:b.runs.map(r=>({...r,config:normalizeAnalysisConfig(r.config??b.config),...(r.status==='running'?{status:'cancelled' as const,error:'Interrupted by a page reload.'}:{})}))}));if(!saved.branches.some(b=>b.id===saved.selectedBranchId))saved.selectedBranchId='main';const restored=seedWorkspace(saved);setWorkspace(resolveSimpleView(restored,initialExperimentId??new URLSearchParams(window.location.search).get('experiment')));}}}catch{toast('Starting a fresh workspace; saved data could not be read.');}setWorkspace(s=>resolveSimpleView(s,initialExperimentId??new URLSearchParams(window.location.search).get('experiment')));setLoaded(true);refreshConnection();},[refreshConnection,initialExperimentId]);
  useEffect(()=>{if(!loaded)return;const timer=setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(workspace));}catch{toast.error('This browser could not save the workspace. Export your report before closing.');}},180);return()=>clearTimeout(timer);},[workspace,loaded]);
  useEffect(()=>{if(!loaded)return;const flush=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(stateRef.current));}catch{/* The normal save path reports storage errors. */}};window.addEventListener('pagehide',flush);return()=>window.removeEventListener('pagehide',flush);},[loaded]);
  useEffect(()=>{const onPopState=()=>setWorkspace(s=>resolveSimpleView(s,window.location.pathname==='/cases/bebop-5pct'?'bebop-5pct':new URLSearchParams(window.location.search).get('experiment')));window.addEventListener('popstate',onPopState);return()=>window.removeEventListener('popstate',onPopState);},[]);
  const changeBranch=(id:string,fn:(b:AnalysisBranch)=>AnalysisBranch)=>setWorkspace(s=>updateBranch(s,id,fn));
  function select(id:string){const target=stateRef.current.branches.find(b=>b.id===id);if(!target)return;const url=`/?experiment=${encodeURIComponent(target.experimentId)}`;if(window.location.pathname+window.location.search!==url)window.history.pushState(null,'',url);notifyLocationChange();setArtifact('report',id);setWorkspace(s=>({...s,selectedBranchId:id,view:'workspace'}));setDraft({text:'',evidenceIds:[],nonce:0});}
  function setArtifact(tab:string,id=branch.id){setActiveArtifacts(t=>({...t,[id]:tab}));}
  function openEvidence(id:string){if(dataset.caseStudy){setSourceEvidenceId(id);return;}if(!artifact||artifact.kind==='report')returnReports.current[branch.id]=artifact?.id??'report';const next=evidenceArtifact(id,getDataset(branch.experimentId));changeBranch(branch.id,b=>({...b,artifacts:b.artifacts.some(a=>a.id===next.id)?b.artifacts:[...b.artifacts,next]}));setArtifact(next.id);if(narrow)setPanelOpen(false);}
  function ask(text:string,evidenceIds:string[]){changeBranch(branch.id,b=>({...b,pathFocusId:undefined}));setDraft({text,evidenceIds:[...new Set(evidenceIds)],nonce:Date.now()});openChat();}
  function setPanelOpen(open:boolean){setPanels(s=>({...s,[branch.id]:{...panel,open}}));}
  function setPanelTab(tab:WorkspacePanelTab){setPanels(s=>({...s,[branch.id]:{open:true,tab}}));}
  function openChat(id=branch.id){setPanels(s=>({...s,[id]:{open:true,tab:'conversation'}}));}
  function sendChat(text:string,ids:string[],pathNodeId=branch.pathFocusId){
    if(!text.trim())return;
    if(busyRef.current){toast('Wait for the current response or stop it first.');return;}
    openChat();
    setDraft({text:'',evidenceIds:[],nonce:Date.now()});
    void run('chat',text.trim(),ids,undefined,branch.id,undefined,pathNodeId);
  }
  function submitPathComment(nodeId:string,comment:string){
    if(!isPathNode(nodeId,branch.pathCustomNodes)||!comment.trim()||busyRef.current)return false;
    changeBranch(branch.id,b=>({...b,pathFocusId:nodeId}));
    sendChat(comment,[],nodeId);
    return true;
  }
  function savePathNode(node:UserPathNode){
    if(busyRef.current)return false;
    const nodes=branch.pathCustomNodes??[];
    const next=nodes.some(item=>item.id===node.id)?nodes.map(item=>item.id===node.id?node:item):[...nodes,node];
    const parsed=userPathNodesSchema.safeParse(next);
    if(!parsed.success){toast.error('节点未保存，请检查内容和关联观察。');return false;}
    const affected=new Set(downstreamPathNodes(node.id,nodes));
    changeBranch(branch.id,b=>({...b,pathCustomNodes:parsed.data,pathRevisions:b.pathRevisions?.map(revision=>({...revision,updates:revision.updates.filter(update=>!affected.has(update.nodeId))}))}));
    return true;
  }
  function removePathNode(id:string){
    if(busyRef.current||!branch.pathCustomNodes?.some(node=>node.id===id))return;
    const affected=new Set(downstreamPathNodes(id,branch.pathCustomNodes));
    changeBranch(branch.id,b=>({...b,pathCustomNodes:removeUserPathNode(b.pathCustomNodes??[],id),pathFocusId:b.pathFocusId===id?undefined:b.pathFocusId,pathRevisions:b.pathRevisions?.map(revision=>({...revision,updates:revision.updates.filter(update=>!affected.has(update.nodeId))}))}));
  }
  function proposeBranch(title='New analysis branch',context='',ids:string[]=[]){setBranchDialog({sourceId:branch.id,title,context,ids});}
  function saveBranch(){if(!branchDialog?.title.trim())return;setWorkspace(s=>{const source=s.branches.find(b=>b.id===branchDialog.sourceId)??s.branches[0];return createBranch(s,source,branchDialog.title,branchDialog.context,branchDialog.ids);});setBranchDialog(null);setDraft({text:'',evidenceIds:[],nonce:0});toast.success('Analysis branch created');}
  function saveAction(finding:Finding){changeBranch(branch.id,b=>addAction(b,finding));toast.success('Action added');}
  function suggestion(s:AgentSuggestion){if(s.kind==='branch')proposeBranch(s.title,s.prompt,s.evidenceIds);else saveAction({title:s.title,body:s.prompt,hypothesis:'Validate this hypothesis against the experiment evidence.',validation:s.prompt,evidenceIds:s.evidenceIds,tone:'neutral'});}
  async function run(mode:'chat'|'analyze',prompt:string,ids:string[]=[],configOverride?:AnalysisConfig,branchId=branch.id,sourceOverride?:AnalysisBranch,pathNodeId?:string,retry=false){
    if(busyRef.current){toast('Wait for the current response or stop it first.');return;}
    const source=sourceOverride??stateRef.current.branches.find(b=>b.id===branchId);if(!source)return;
    const config=structuredClone(configOverride??source.config);
    if(!connected){
      const data=getDataset(source.experimentId);
      const runId=uid();
      const reply=mockConversationReply(prompt,data,ids);
      const report:Artifact|undefined=mode==='analyze'?{id:uid(),title:'Experiment report',kind:'report',metricId:'activation',evidenceIds:reply.evidenceIds,origin:'demo',runId,config,report:configuredDemo(config,data)}:undefined;
      setErrors(e=>({...e,[branchId]:''}));
      changeBranch(branchId,b=>({...b,messages:[...b.messages,...(mode==='chat'&&!retry?[{id:uid(),role:'user' as const,text:prompt,pathNodeId,evidenceIds:ids,origin:'user' as const,status:'complete' as const}]:[]),{id:uid(),role:'assistant',pathNodeId,...reply}],artifacts:report?[...b.artifacts,report]:b.artifacts,runs:[...b.runs,{id:runId,mode,startedAt:new Date().toISOString(),status:'complete',artifactIds:report?[report.id]:[],config}]}));
      if(report)setArtifact(report.id,branchId);
      openChat(branchId);
      return;
    }
    const job:Busy={branchId,mode,prompt,evidenceIds:ids,runId:uid(),messageId:uid(),config,pathNodeId};busyRef.current=job;setBusy(job);retryRef.current=job;setStage('Reading the experiment');setErrors(e=>({...e,[branchId]:''}));
    const startedAt=new Date().toISOString();
    changeBranch(branchId,b=>({...b,config:structuredClone(config),messages:[...b.messages,...(mode==='chat'&&!retry?[{id:uid(),role:'user' as const,text:prompt,pathNodeId,evidenceIds:ids,origin:'user' as const,status:'complete' as const}]:[]),{id:job.messageId,role:'assistant',text:'',pathNodeId,evidenceIds:[],origin:'ai',status:'incomplete'}],runs:[...b.runs,{id:job.runId,mode,startedAt,status:'running',artifactIds:[],config:structuredClone(config)}]}));
    const abort=new AbortController();abortRef.current=abort;let gotDone=false;let pendingRevision:PathRevision|undefined;
    function event(data:AgentEvent){
      if(data.type==='error')throw new Error(data.message);
      if(data.type==='stage'){setStage(data.label);return;}
      if(data.type==='path-revision'){
        if(!pathNodeId||data.revision.nodeId!==pathNodeId||data.revision.id!==job.runId)throw new Error('Unexpected path revision');
        validatePathResult(pathNodeId,data.revision,Object.keys(getDataset(source!.experimentId).evidenceById),source!.pathCustomNodes);
        pendingRevision=data.revision;return;
      }
      if(data.type==='done'&&pathNodeId&&!pendingRevision)throw new Error('The node revision was incomplete. Your previous results are preserved.');
      changeBranch(branchId,b=>{
        if(data.type==='artifact'){data.artifact.config=structuredClone(config);if(b.artifacts.some(a=>a.id===data.artifact.id))return b;setActiveArtifacts(t=>({...t,[branchId]:data.artifact.id}));return {...b,artifacts:[...b.artifacts,data.artifact],runs:b.runs.map(r=>r.id===job.runId?{...r,artifactIds:[...r.artifactIds,data.artifact.id]}:r)};}
        if(data.type==='done'){gotDone=true;return {...b,...(pendingRevision?{pathRevisions:[...(b.pathRevisions??[]),pendingRevision]}:{}),messages:b.messages.map(m=>m.id===job.messageId?{...m,status:'complete',evidenceIds:data.evidenceIds,...(pendingRevision?{pathRevisionId:pendingRevision.id}:{})}:m),runs:b.runs.map(r=>r.id===job.runId?{...r,status:'complete'}:r)};}
        return {...b,messages:b.messages.map(m=>m.id!==job.messageId?m:data.type==='delta'?{...m,text:m.text+data.text}:data.type==='tool'?{...m,tools:[...(m.tools??[]),data.label]}:data.type==='suggestions'?{...m,suggestions:data.suggestions}:m)};
      });
      if(data.type==='done')gotDone=true;
    }
    try{
      const response=await fetch('/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},signal:abort.signal,body:JSON.stringify({mode,...(pathNodeId?{pathContext:{nodeId:pathNodeId,customNodes:source.pathCustomNodes??[],current:Object.values(currentPathUpdates(source.pathRevisions,source.pathCustomNodes))}}:{}),experimentId:source.experimentId,snapshotId:source.snapshotId,branchId,runId:job.runId,prompt,config,context:source.context,evidenceIds:[...new Set([...source.evidenceIds,...ids])],history:source.messages.filter(m=>m.status!=='incomplete'&&(!pathNodeId||m.pathNodeId===pathNodeId)).slice(-20).map(m=>({role:m.role,text:m.text.slice(0,16000)}))})});
      if(!response.ok){const body=await response.json() as {error?:string};throw new Error(body.error||'The analysis could not start.');}
      if(!response.body)throw new Error('The response stream was unavailable.');const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';
      while(true){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});const frames=buffer.split('\n\n');buffer=frames.pop()??'';for(const frame of frames){const line=frame.split('\n').find(l=>l.startsWith('data: '));if(line)event(JSON.parse(line.slice(6)));}}
      if(!gotDone)throw new Error('The response ended early. You can retry without losing completed results.');
    }catch(error){const cancelled=abort.signal.aborted;const message=cancelled?'Response stopped. Completed artifacts are preserved.':error instanceof Error?error.message:'The response could not be completed.';setErrors(e=>({...e,[branchId]:message}));changeBranch(branchId,b=>({...b,runs:b.runs.map(r=>r.id===job.runId?{...r,status:cancelled?'cancelled':'error',error:message}:r)}));}
    finally{busyRef.current=null;setBusy(null);abortRef.current=null;setStage('');}
  }
  function configure(config:AnalysisConfig){
    if(busyRef.current){toast('Wait for the current response or stop it first.');return;}
    const demo:Artifact|undefined=connected?undefined:{id:`demo-${uid()}`,config:structuredClone(config),title:'Experiment report',kind:'report',metricId:'activation',evidenceIds:dataset.evidence.map(e=>e.id),origin:dataset.caseStudy?'source':'demo',report:configuredDemo(config,dataset)};
    changeBranch(branch.id,b=>({...b,config:structuredClone(config),artifacts:demo?[...b.artifacts,demo]:b.artifacts}));
    if(demo)setArtifact(demo.id);
    setSettings(false);setDraft({text:'',evidenceIds:[],nonce:0});
    if(connected)void run('analyze','Analyze this experiment against the configured objective and metric boundaries. Explain the evidence, trade-offs, uncertainties, and useful next steps.',[],config);
  }
  function download(){const exported=artifact?.kind==='report'?artifact:lastReport;const exportBranch={...branch,config:exported?.config??branch.runs.find(r=>r.id===exported?.runId)?.config??branch.config};const content=exportReport(exportBranch,exported?.report);const url=URL.createObjectURL(new Blob([content],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`elsa-${branch.id==='main'?experiment.id:branch.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.md`;a.click();URL.revokeObjectURL(url);toast.success('Report exported');}
  async function copy(){try{const reportArtifact=artifact?.kind==='report'?artifact:lastReport;const raw=reportArtifact?.report;const config=reportArtifact?.config??branch.runs.find(r=>r.id===reportArtifact?.runId)?.config??branch.config;const report=raw?reportReadout(raw,dataset,config,reportArtifact?.origin):undefined;await navigator.clipboard.writeText(`${experiment.name}\n${report?.headline??branch.name}\n${report?.summary??branch.context}\n\n${dataset.caseStudy?'Source-reported observations from supplied materials; no raw event data.':'Synthetic demonstration data.'}`);toast.success('Summary copied');}catch{toast.error('Clipboard access was unavailable. Export the report instead.');}}
  const composer=<AssistantComposer compact draft={draft} busy={Boolean(aiBusy)} onDraftChange={setDraft} onSend={sendChat} onStop={()=>abortRef.current?.abort()}/>;
  const assistant=<AssistantPanel branch={branch} connected={connected} busy={Boolean(aiBusy)} stage={stage} error={errors[branch.id]??''} draft={draft} onDraftChange={setDraft} active={chatOpen} onSend={sendChat} onStop={()=>abortRef.current?.abort()} onRetry={()=>{const retry=retryRef.current;if(retry?.branchId===branch.id)void run(retry.mode,retry.prompt,retry.evidenceIds,retry.config,retry.branchId,undefined,retry.pathNodeId,true);else void run('analyze','Analyze the experiment and recommend the next steps.');}} onEvidence={openEvidence} onSuggestion={suggestion} onReport={()=>{setArtifact(lastReport?.id??'report');if(narrow)setPanelOpen(false);}} onSetup={()=>setSetup(true)}/>;
  const legacyContent=<ReportViewport scrollKey={`${branch.id}-${selected}`} composer={!chatOpen ? composer : null}>
    {aiBusy&&busy?.mode==='analyze'&&<Item variant="muted" role="status"><Spinner/><ItemContent><ItemTitle>{stage}</ItemTitle></ItemContent><ItemActions><Button variant="ghost" size="sm" onClick={()=>abortRef.current?.abort()}>Stop</Button></ItemActions></Item>}
    {artifact&&artifact.kind!=='report'?<>
      <div className="px-5 pt-5 md:px-8"><Button variant="ghost" size="sm" onClick={()=>setArtifact(returnReports.current[branch.id]??'report')}><ArrowLeft/>Back to report</Button></div>
      <EvidenceView artifact={artifact} onAsk={ask} onBranch={proposeBranch}/>
    </>:<>
      <ReportView branch={reportBranch} artifact={artifact} onEvidence={openEvidence} onAsk={ask} onBranch={proposeBranch} onAction={saveAction} onRun={()=>void run('analyze','Analyze this branch focus, respecting the inherited experiment configuration and evidence.')}/>
      {!dataset.caseStudy&&<div className="flex justify-end px-5 pb-6 md:px-8"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" aria-label="Report options"><MoreHorizontal/>More</Button></DropdownMenuTrigger><DropdownMenuContent align="end" side="top">
        <DropdownMenuItem onSelect={copy}><Clipboard/>Copy summary</DropdownMenuItem>
        <DropdownMenuItem onSelect={download}><Download/>Export Markdown</DropdownMenuItem>
        <DropdownMenuSeparator/>
        <DropdownMenuItem onSelect={()=>setBranchPicker(true)}><GitBranch/>Analysis branches</DropdownMenuItem>
        <DropdownMenuItem onSelect={()=>setSettings(true)}><Settings2/>Analysis settings</DropdownMenuItem>
        <DropdownMenuItem onSelect={()=>setHistory(true)}><History/>Analysis history</DropdownMenuItem>
      </DropdownMenuContent></DropdownMenu></div>}
    </>}
  </ReportViewport>;
  const designReport = experiment.id === 'bebop-5pct' && (!artifact || artifact.kind === 'report');
  const designContent = <DesignAnalysisReport onAsk={ask} onEvidence={openEvidence} data={dataset.caseStudy!} branch={branch} onAction={saveAction}/>;
  return <ExperimentDataProvider value={dataset}><PathDiscussionProvider value={{customNodes:branch.pathCustomNodes??[],saveNode:savePathNode,removeNode:removePathNode,revisions:branch.pathRevisions??[],busy:Boolean(busy),busyNodeId:aiBusy?busy?.pathNodeId:undefined,focusId:branch.pathFocusId,focus:id=>changeBranch(branch.id,b=>({...b,pathFocusId:id})),submit:submitPathComment}}><TooltipProvider><div className="flex h-dvh min-h-0 flex-col overflow-hidden">
    <WorkbenchLayout onContentResize={width=>setNarrow(width<940)}>
    <main className="flex h-dvh w-full min-w-0 flex-1 flex-col">
      <ExperimentHeader name={libraryReport?.title ?? experimentName} library={workspace.view==='library' && !libraryReport} home={openLibrary} connected={connected} model={model}/>
      <div className={workspace.view==='library' && !libraryReport?'flex min-h-0 flex-1 flex-col':'hidden'} hidden={workspace.view!=='library' || Boolean(libraryReport)}><ExperimentLibrary active={workspace.view==='library' && !libraryReport} onReport={openReport} onAnalyze={data=>select(sessionIdForExperiment(data.experiment.id))} busy={!loaded} followedExperimentIds={Array.isArray(workspace.followedExperimentIds)?workspace.followedExperimentIds:[]}/></div>
      {libraryReport ? <LibraryReportDetail key={libraryReport.id} report={libraryReport}/> : workspace.view==='library'?null:<>
        {designReport ? <DesignAnalysisLayout open={panel.open} activeTab={panel.tab} narrow={narrow} onOpenChange={setPanelOpen} onTabChange={setPanelTab} conversation={assistant} composer={!chatOpen && <DesignComposer draft={draft} busy={Boolean(aiBusy)} onDraftChange={setDraft} onSend={sendChat}/>}>
          {designContent}
        </DesignAnalysisLayout> : <div className="relative min-h-0 min-w-0 flex-1"><Button id="toggle-workspace-panel" variant="ghost" className="absolute right-[38px] top-8 z-30 size-5 p-0 hover:bg-transparent" aria-label={panel.open ? 'Collapse workspace panel' : 'Expand workspace panel'} aria-expanded={panel.open} aria-controls="experiment-workspace-panel" onClick={()=>setPanelOpen(!panel.open)}><DesignIcon file="12a85"/></Button><WorkspacePanel key={branch.id} open={panel.open} activeTab={panel.tab} narrow={narrow} onOpenChange={setPanelOpen} onTabChange={setPanelTab} conversation={assistant} prototype={experimentDemo?<ExperimentDemoPanel demo={experimentDemo}/>:undefined}>{legacyContent}</WorkspacePanel></div>}
      </>}
    </main>
    </WorkbenchLayout>
    <CaseEvidenceDialog evidenceId={sourceEvidenceId} onClose={()=>setSourceEvidenceId(null)}/>
    <Dialog open={branchPicker} onOpenChange={setBranchPicker}><DialogContent><DialogHeader><DialogTitle>Analysis branches</DialogTitle><DialogDescription>{experiment.name}</DialogDescription></DialogHeader><div className="flex max-h-[50dvh] flex-col gap-1 overflow-y-auto">{workspace.branches.filter(b=>(b.parentId??b.id)===(branch.parentId??branch.id)).map(b=><Button key={b.id} variant={b.id===branch.id?'secondary':'ghost'} className="justify-between" aria-current={b.id===branch.id?'true':undefined} onClick={()=>{select(b.id);setBranchPicker(false);}}><span className="truncate">{b.parentId?b.name:'Main analysis'}</span>{b.id===branch.id&&<Check/>}</Button>)}</div><Button variant="outline" onClick={()=>{setBranchPicker(false);proposeBranch();}}><GitBranch/>New analysis branch</Button></DialogContent></Dialog>
    <Dialog open={Boolean(branchDialog)} onOpenChange={open=>{if(!open)setBranchDialog(null);}}><DialogContent><DialogHeader><DialogTitle>Follow a new question</DialogTitle><DialogDescription>Create an analysis branch with the same experiment data and its own conversation.</DialogDescription></DialogHeader>{branchDialog&&<>
      <Label htmlFor="branch-name">Branch name</Label><Input id="branch-name" value={branchDialog.title} onChange={e=>setBranchDialog({...branchDialog,title:e.target.value})} maxLength={80}/>
      <Label htmlFor="branch-context">What do you want to explore?</Label><Textarea id="branch-context" value={branchDialog.context} onChange={e=>setBranchDialog({...branchDialog,context:e.target.value})} maxLength={3000}/>
      <EvidenceChips ids={branchDialog.ids} onOpen={openEvidence}/><p className="text-sm leading-relaxed text-muted-foreground">Inherits the current metric settings and selected evidence. The main analysis is preserved.</p><Button onClick={saveBranch} disabled={!branchDialog.title.trim()}><GitBranch/>Create analysis branch</Button>
    </>}</DialogContent></Dialog>
    <Dialog open={settings} onOpenChange={setSettings}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Analysis settings</DialogTitle><DialogDescription>Changes apply to the next analysis. Earlier results remain available in history.</DialogDescription></DialogHeader><Configuration key={branch.id} initial={branch.config} connected={connected} onSubmit={config=>configure(config)}/></DialogContent></Dialog>
    <Dialog open={setup} onOpenChange={setSetup}><DialogContent><DialogHeader><DialogTitle>AI connection</DialogTitle><DialogDescription>Live analysis availability for this ELSA workspace.</DialogDescription></DialogHeader>
      <Alert><AlertDescription><strong>{connected?'OpenAI is configured':'Connect your AI partner'}</strong><p>{connected?`Model: ${model}`:'Prepared examples are available. Free-form questions and new analyses require an OpenAI API key.'}</p></AlertDescription></Alert>
      {!connected&&<p className="text-sm text-muted-foreground">Ask the site owner to enable AI. You can explore prepared reports, inspect evidence, create analysis branches, and build action plans in the meantime.</p>}
      <p className="text-sm leading-relaxed text-muted-foreground">The key stays on the server. The selected experiment’s evidence is supplied to the model, including source-reported case data when selected. Experiment platforms are not connected.</p><Button variant="outline" onClick={()=>{refreshConnection();toast('Connection configuration refreshed');}}><RotateCcw/>Refresh connection status</Button><Button variant="link" asChild><a href="https://github.com/ibelick/prompt-kit" target="_blank" rel="noreferrer">prompt-kit<ArrowUpRight/></a></Button>
    </DialogContent></Dialog>
    <Dialog open={history} onOpenChange={setHistory}><DialogContent><DialogHeader><DialogTitle>Analysis history</DialogTitle><DialogDescription>Every run keeps its own settings and completed artifacts.</DialogDescription></DialogHeader><ItemGroup className="max-h-[60dvh] gap-3 overflow-y-auto">{branch.runs.length===0&&<p className="text-sm text-muted-foreground">No live runs yet. This workspace currently shows a prepared report.</p>}{[...branch.runs].reverse().map(r=><Item variant="outline" key={r.id}><ItemContent><ItemTitle>{r.mode==='analyze'?'Experiment analysis':'Conversation'}</ItemTitle><ItemDescription>{new Date(r.startedAt).toLocaleString()}</ItemDescription><Badge variant="outline">{r.status}</Badge>{r.error&&<ItemDescription>{r.error}</ItemDescription>}</ItemContent>{r.artifactIds.length>0&&<ItemActions><Button variant="outline" size="sm" onClick={()=>{setArtifact(r.artifactIds[0]);setHistory(false);}}>Open result</Button></ItemActions>}</Item>)}</ItemGroup></DialogContent></Dialog>
    <Toaster position="bottom-center" richColors/>
  </div></TooltipProvider></PathDiscussionProvider></ExperimentDataProvider>;
}
