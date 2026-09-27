'use client';
import { ArrowRight, Target, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PromptInput, PromptInputTextarea, PromptInputActions } from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription } from '@/components/ui/item';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { DEMO_URL } from '@/lib/metis/data';
import { datasetForUrl } from '@/lib/metis/datasets';
import { number } from '@/lib/metis/domain';
import { useExperimentData } from './experiment-data';
import { selectedExperiment, selectedScorecard } from '@/lib/metis/experiment-catalog';
import type { AnalysisConfig, MetricRole } from '@/lib/metis/types';
import { ExperimentSelector } from './experiment-selector';

export function StartScreen({ url, onUrlChange: setUrl, onConfirm, connected, inspect, groupName, groupExperimentUrls }: { url: string; onUrlChange: (url: string)=>void; onConfirm: (config: AnalysisConfig)=>void; connected: boolean; inspect: ()=>void; groupName?: string; groupExperimentUrls?: string[] }) {
  const {defaultConfig,experiment,caseStudy}=useExperimentData();
  const hasExperiment = Boolean(url.trim());
  const selected = selectedExperiment(url);
  const scorecard = groupName ? selectedScorecard(url,groupName,groupExperimentUrls) : undefined;
  const heading = scorecard ? `What would you like to understand about ${scorecard.name}?` : groupName ? `What would you like to explore in ${groupName}?` : selected
    ? `Let’s analyze ${selected.name}. What would you like to understand?`
    : url ? 'What would you like to understand about this experiment?'
    : 'Share your experiment ID and requirements. I’ll analyze it.';
  const [selectorOpen,setSelectorOpen]=useState(false);
  const [requirements,setRequirements]=useState('');
  const [error,setError]=useState('');
  const [unsupported,setUnsupported]=useState(false);
  const [confirm,setConfirm]=useState(false);
  useEffect(()=>{setError('');setUnsupported(false);},[url]);
  function load(){
    if(!hasExperiment)return;
    setError('');setUnsupported(false);
    try {
      const input=new URL(url);
      if(!['https:','http:'].includes(input.protocol))throw new Error();
      if(!datasetForUrl(url)){setUnsupported(true);return;}
      setConfirm(true);
    } catch { setError('Enter a valid experiment URL, including https://.'); }
  }
  return <div className="flex min-h-0 flex-1 flex-col overflow-auto p-5 md:p-10">
    <div className="m-auto w-full max-w-2xl space-y-8 py-12">
      <h1 aria-hidden={selectorOpen} className={`mx-3 text-3xl font-semibold tracking-tight transition-opacity duration-200 ease-out motion-reduce:transition-none md:text-4xl ${selectorOpen?'opacity-0':'opacity-100'}`}>{heading}</h1>
      <form onSubmit={e=>{e.preventDefault();load();}}>
        <ExperimentSelector value={url} onChange={value=>{setUrl(value);setError('');setUnsupported(false);}} open={selectorOpen} onOpenChange={setSelectorOpen} groupName={groupName} groupExperimentUrls={groupExperimentUrls}/>
        <PromptInput value={requirements} onValueChange={setRequirements} onSubmit={load} className="relative flex items-end gap-2" data-testid="experiment-composer">
          <PromptInputTextarea className="min-h-9 min-w-0 flex-1" aria-label="Analysis requirements" placeholder="Let me know if you have any additional preferences"/>
          <PromptInputActions className="shrink-0">
            <Button type="submit" disabled={!hasExperiment} onClick={event=>event.stopPropagation()}>Analyze</Button>
          </PromptInputActions>
        </PromptInput>
      </form>
      {error&&<Alert variant="destructive" id="experiment-url-error"><AlertCircle/><AlertDescription>{error}</AlertDescription></Alert>}
      {unsupported&&<Alert role="status"><AlertCircle/><AlertTitle>This experiment platform isn’t connected yet.</AlertTitle><AlertDescription><p>Your link has not been read. You can use a prepared demo dataset to explore the analysis.</p><Button variant="outline" onClick={()=>{setUrl(DEMO_URL);setUnsupported(false);setConfirm(true);}}>Continue with demo data<ArrowRight/></Button></AlertDescription></Alert>}
    </div>
    <Dialog open={confirm} onOpenChange={setConfirm}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{caseStudy?'Source case loaded':'Demo experiment loaded'}</DialogTitle><DialogDescription>Confirm your objective and the metrics that matter.</DialogDescription></DialogHeader><Configuration key={`${experiment.id}-${requirements}`} initial={{...structuredClone(defaultConfig),requirements}} connected={connected} onSubmit={onConfirm} onInspect={inspect}/></DialogContent></Dialog>
  </div>;
}

export function Configuration({ initial, connected, onSubmit, onInspect }: { initial:AnalysisConfig; connected:boolean; onSubmit:(config:AnalysisConfig)=>void; onInspect?:()=>void }) {
  const {experiment,metrics,caseStudy}=useExperimentData();
  const [config,setConfig]=useState(structuredClone(initial));
  const [error,setError]=useState('');
  function submit(){
    if(!Object.values(config.roles).includes('target')){setError('Select at least one Target metric before continuing.');return;}
    if(!config.objective.trim()){setError('Add an experiment objective.');return;}
    if(Object.values(config.thresholds).some(x=>!Number.isFinite(x)||x<0)){setError('Thresholds must be zero or a positive number.');return;}
    setError('');onSubmit(config);
  }
  if(caseStudy)return <div className="space-y-5"><p className="text-sm leading-relaxed">{caseStudy.objective}</p><Alert><AlertDescription>Reported observations from Jing’s supplied PPT and screenshots. Confidence intervals and numerical rollout thresholds were not supplied. This opens a source reconstruction; new AI interpretation requires a connection.</AlertDescription></Alert><div className="space-y-2"><Label htmlFor="case-focus">Additional focus</Label><Textarea id="case-focus" value={config.requirements} onChange={e=>setConfig({...config,requirements:e.target.value})}/></div><Button onClick={()=>onSubmit(config)}>{connected?'Analyze supplied evidence':'Open case report'}<ArrowRight/></Button>{onInspect&&<Button variant="link" onClick={onInspect}>Open existing investigation</Button>}</div>;
  return <div className="space-y-6">
    <Item variant="outline"><ItemMedia variant="icon"><Target/></ItemMedia><ItemContent><ItemTitle>{experiment.name}</ItemTitle><ItemDescription>Control vs. Treatment · {number(experiment.controlN+experiment.treatmentN)} users · {experiment.start}–{experiment.end}</ItemDescription></ItemContent></Item>
    <Alert><AlertDescription>Synthetic dataset · No data has been loaded from an external platform.</AlertDescription></Alert>
    <div className="space-y-2"><Label htmlFor="objective">What does success look like?</Label><Textarea id="objective" value={config.objective} onChange={e=>setConfig({...config,objective:e.target.value})}/></div>
    <div className="space-y-4"><Label>Metrics to focus on</Label><p className="text-sm text-muted-foreground">Thresholds use absolute change</p>
      {metrics.map(m=><div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_140px_80px]" key={m.id}>
        <div className="col-span-2 space-y-1 sm:col-span-1"><Label htmlFor={`role-${m.id}`}>{m.name}</Label><p className="text-xs text-muted-foreground">{m.unit==='%'?'Percentage points':m.unit==='ms'?'Milliseconds':'Sessions per user'}</p></div>
        <NativeSelect id={`role-${m.id}`} value={config.roles[m.id]} onChange={e=>setConfig({...config,roles:{...config.roles,[m.id]:e.target.value as MetricRole}})}>{['target','guardrail','fundamental','excluded'].map(r=><NativeSelectOption key={r} value={r}>{r[0].toUpperCase()+r.slice(1)}</NativeSelectOption>)}</NativeSelect>
        {['target','guardrail'].includes(config.roles[m.id])?<Input aria-label={`${m.name} threshold`} type="number" step="0.01" min="0" value={Number.isNaN(config.thresholds[m.id])?'':config.thresholds[m.id]} onChange={e=>setConfig({...config,thresholds:{...config.thresholds,[m.id]:e.target.value===''?NaN:Number(e.target.value)}})}/>:<span className="text-center text-muted-foreground">—</span>}
      </div>)}
      <p className="text-sm leading-relaxed text-muted-foreground">Target: minimum useful gain. Guardrail: maximum acceptable harm. Unexpected changes are discovered during analysis.</p>
    </div>
    <div className="space-y-2"><Label htmlFor="custom-requirements">Additional focus</Label><Input id="custom-requirements" value={config.requirements} onChange={e=>setConfig({...config,requirements:e.target.value})} placeholder="e.g. Look more closely at mobile performance"/></div>
    {error&&<Alert variant="destructive"><AlertCircle/><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{connected?'Ready to analyze with live AI':'AI is not connected. You can open the prepared demo.'}</p><Button onClick={submit}>{connected?'Start analysis':'Open demo report'}<ArrowRight/></Button></div>
    {onInspect&&<Button variant="link" onClick={onInspect}>Open the existing demo report</Button>}
  </div>;
}
