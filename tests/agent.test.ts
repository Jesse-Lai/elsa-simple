import test from 'node:test';
import assert from 'node:assert/strict';
import { POST, friendlyError } from '../app/api/agent/route';
import { defaultConfig, demoReport, experiment } from '../lib/metis/data';
import { getDataset } from '../lib/metis/datasets';
import type { AgentEvent } from '../lib/metis/types';
import { analysisModes } from '../lib/metis/analysis-modes';
const requestBody=()=>({mode:'analyze',experimentId:experiment.id,snapshotId:experiment.snapshotId,branchId:'main',runId:'test-run',prompt:'What would change the recommendation?',config:structuredClone(defaultConfig),context:'',evidenceIds:[],history:[]});
const request=(body:unknown=requestBody(),signal?:AbortSignal)=>new Request('http://localhost/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
const events=async(response:Response)=>(await response.text()).split('\n\n').filter(x=>x.startsWith('data: ')).map(x=>JSON.parse(x.slice(6)) as AgentEvent);
const response=(output:unknown[])=>({id:'resp-test',object:'response',created_at:1,status:'completed',model:'gpt-5.6-terra',output,error:null,incomplete_details:null});
const message=(text:string)=>({id:'msg-test',type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text,annotations:[]}]});
const result=()=>({report:demoReport,artifacts:[{title:'Activation trend',kind:'trend',metricId:'activation',evidenceIds:['trend:activation']}],suggestions:[{kind:'branch',title:'Investigate Android',prompt:'Profile lower-end Android',evidenceIds:['segment:latency']}],evidenceIds:['metric:activation','segment:latency']});
async function withMock(fetcher:typeof fetch,fn:()=>Promise<void>){const oldFetch=globalThis.fetch;const oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-key-not-a-real-credential';globalThis.fetch=fetcher;try{await fn();}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}}
function streamReply(text:string,output:unknown[]){return new Response(`event: response.output_text.delta\ndata: ${JSON.stringify({type:'response.output_text.delta',delta:text,output_index:0,content_index:0,item_id:'msg-test',sequence_number:1})}\n\nevent: response.completed\ndata: ${JSON.stringify({type:'response.completed',response:response(output),sequence_number:2})}\n\n`,{headers:{'Content-Type':'text/event-stream'}});}
test('invalid input, unknown evidence and missing key never call a provider',async()=>{
  await withMock(async()=>{throw new Error('Provider must not be called');},async()=>{
    assert.equal((await POST(request({...requestBody(),prompt:''}))).status,400);
    assert.equal((await POST(request({...requestBody(),config:{...defaultConfig,analysisMode:'invented-mode'}}))).status,400);
    assert.equal((await POST(request({...requestBody(),evidenceIds:['invented']}))).status,400);
    assert.equal((await POST(request({...requestBody(),experimentId:'constructor'}))).status,400);
    assert.equal((await POST(request({...requestBody(),experimentId:'pricing-page-refresh'}))).status,400);
    assert.equal((await POST(request({...requestBody(),evidenceIds:['toString']}))).status,400);
    const config=structuredClone(defaultConfig);config.roles.activation='fundamental';assert.equal((await POST(request({...requestBody(),config}))).status,400);
    delete process.env.OPENAI_API_KEY;assert.equal((await POST(request())).status,503);
  });
});
test('each session supplies its own snapshot and metric tool records to both model passes',async()=>{
  for(const id of ['pricing-page-refresh','payment-methods']){
    const dataset=getDataset(id);let calls=0;
    await withMock(async(_url,options)=>{
      const body=JSON.parse(options?.body as string);calls++;
      assert.ok(body.instructions.includes(dataset.experiment.snapshotId));
      assert.ok(body.instructions.includes(dataset.metricById.activation.name));
      assert.match(body.instructions,/Write concrete, data-backed conclusions/);
      assert.match(body.instructions,/one plain-English sentence answering whether the experiment achieved its stated objective/);
      assert.match(body.instructions,/TRUSTED NUMERICAL READOUTS/);
      assert.match(body.instructions,/quantify how far the observed change exceeds the limit/);
      assert.doesNotMatch(body.instructions,/onboarding-2026-09-14-v1|Onboarding latency/);
      if(calls===1)return streamReply('',[{type:'function_call',name:'read_experiment_evidence',arguments:JSON.stringify({kind:'metrics',metricId:'activation'}),call_id:'call-session',id:'fc-session',status:'completed'}]);
      const tool=body.input.find((x:{type:string})=>x.type==='function_call_output');
      assert.deepEqual(JSON.parse(tool.output),dataset.metricById.activation);
      if(body.stream)return streamReply('Read the current primary outcome [metric:activation].',[message('Read the current primary outcome [metric:activation].')]);
      return Response.json(response([message(JSON.stringify({report:dataset.demoReport,artifacts:[],suggestions:[],evidenceIds:['metric:activation']}))]));
    },async()=>{
      const out=await events(await POST(request({...requestBody(),experimentId:id,snapshotId:dataset.experiment.snapshotId,config:dataset.defaultConfig})));
      assert.equal(out.at(-1)?.type,'done');assert.equal(calls,3);
      const artifact=out.find(e=>e.type==='artifact');
      assert.equal(artifact?.type==='artifact'&&artifact.artifact.report?.headline,dataset.demoReport.headline);
    });
  }
});
test('streamed text, checked report, chart and branch suggestions reach the client',async()=>{
  let calls=0;await withMock(async(_url,options)=>{calls++;const body=JSON.parse(options?.body as string);assert.equal(body.store,false);if(body.stream)return streamReply('Activation improves [metric:activation].',[message('Activation improves [metric:activation].')]);return Response.json(response([message(JSON.stringify(result()))]));},async()=>{
    const out=await events(await POST(request()));assert.ok(out.some(e=>e.type==='delta'));assert.equal(out.filter(e=>e.type==='artifact').length,2);assert.ok(out.some(e=>e.type==='suggestions'));assert.equal(out.at(-1)?.type,'done');assert.equal(calls,2);
  });
});

test('the real case uses source-only tools and keeps source provenance in both model passes',async()=>{
  const data=getDataset('bebop-5pct');let calls=0;
  await withMock(async(_url,options)=>{
    calls++;const body=JSON.parse(options?.body as string);
    assert.match(body.instructions,/REAL SOURCE-REPORTED OBSERVATIONS/);
    assert.doesNotMatch(body.instructions,/All experiment data is SYNTHETIC|Include synthetic data/);
    if(calls===1){assert.equal(body.tools[0].name,'read_case_evidence');return streamReply('',[{type:'function_call',name:'read_case_evidence',arguments:JSON.stringify({kind:'metrics',id:'non-zq-cancel'}),call_id:'case-call',id:'case-fc',status:'completed'}]);}
    const tool=body.input.find((item:{type:string})=>item.type==='function_call_output');
    assert.equal(JSON.parse(tool.output)[0].control,1.11);
    if(body.stream)return streamReply('Both cancellation slices regress [source:P3-image]. No causal contribution is established.',[message('Both cancellation slices regress [source:P3-image]. No causal contribution is established.')]);
    return Response.json(response([message(JSON.stringify({report:data.demoReport,artifacts:[{title:'Cancellation comparison',kind:'comparison',metricId:'crashes',evidenceIds:['segment:crashes','source:P3-image']}],suggestions:[],evidenceIds:['source:P3-image']}))]));
  },async()=>{
    const out=await events(await POST(request({...requestBody(),experimentId:data.experiment.id,snapshotId:data.experiment.snapshotId,config:data.defaultConfig,prompt:'Reconstruct Jing’s investigation and chart cancellation.'})));
    assert.equal(out.at(-1)?.type,'done');assert.equal(calls,3);
    assert.ok(out.some(event=>event.type==='artifact'&&event.artifact.kind==='comparison'));
    assert.ok(out.some(event=>event.type==='done'&&event.evidenceIds.includes('source:P3-image')));
  });
});

test('real-case invented trends, unsupported comparisons, approval and unknown sources are rejected',async()=>{
  const data=getDataset('bebop-5pct');
  for(const invalid of ['trend','comparison','approval','source']){
    await withMock(async(_url,options)=>{
      const body=JSON.parse(options?.body as string);
      const text=invalid==='source'?'Claim [source:invented].':'Source-based answer.';
      if(body.stream)return streamReply(text,[message(text)]);
      return Response.json(response([message(JSON.stringify({report:{...data.demoReport,...(invalid==='approval'?{recommendation:'ship'}:{})},artifacts:invalid==='trend'?[{title:'Invented daily series',kind:'trend',metricId:'activation',evidenceIds:['metric:activation']}]:invalid==='comparison'?[{title:'Wrong metric',kind:'comparison',metricId:'retention',evidenceIds:['metric:retention']}]:[],suggestions:[],evidenceIds:['source:P1']}))]));
    },async()=>{
      const out=await events(await POST(request({...requestBody(),experimentId:data.experiment.id,snapshotId:data.experiment.snapshotId,config:data.defaultConfig})));
      assert.equal(out.at(-1)?.type,'error');assert.equal(out.filter(event=>event.type==='artifact').length,0);
    });
  }
});
test('all four composer modes reach both provider passes with current branch context',async()=>{
  for(const mode of analysisModes){
    let calls=0;
    await withMock(async(_url,options)=>{
      calls++;const body=JSON.parse(options?.body as string);
      assert.ok(body.instructions.includes(`CURRENT ANALYSIS MODE ${mode.label}:`));
      assert.ok(body.instructions.includes('Focus on mobile onboarding'));
      if(mode.id==='srm-investigation'){
        assert.match(body.instructions,/Equal observed counts alone do not establish valid randomization/);
        assert.match(body.instructions,/Do not invent an allocation contract, SRM statistic, p-value, pass\/fail result, or root cause/);
      }
      if(body.stream)return streamReply('A focused answer [metric:activation].',[message('A focused answer [metric:activation].')]);
      return Response.json(response([message(JSON.stringify({...result(),report:null,artifacts:[],suggestions:[]}))]));
    },async()=>{
      const body={...requestBody(),mode:'chat',config:{...defaultConfig,analysisMode:mode.id},context:'Focus on mobile onboarding'};
      const out=await events(await POST(request(body)));
      assert.equal(out.at(-1)?.type,'done');assert.equal(calls,2);
      assert.equal(out.filter(e=>e.type==='artifact').length,0);
    });
  }
});
test('only supported local evidence tools execute and missing data stays unavailable',async()=>{
  let calls=0;await withMock(async(_url,options)=>{const body=JSON.parse(options?.body as string);calls++;if(calls===1)return streamReply('',[{type:'function_call',name:'read_experiment_evidence',arguments:JSON.stringify({kind:'trend',metricId:'retention'}),call_id:'call-test',id:'fc-test',status:'completed'}]);
    if(body.stream){const tool=body.input.find((x:{type:string})=>x.type==='function_call_output');assert.match(tool.output,/unavailable/);return streamReply('No daily retention series is available.',[message('No daily retention series is available.')]);}
    return Response.json(response([message(JSON.stringify({...result(),artifacts:[]}))]));
  },async()=>{const out=await events(await POST(request()));assert.ok(out.some(e=>e.type==='tool'));assert.equal(out.at(-1)?.type,'done');});
});
test('unverified references and unsupported chart types never become artifacts',async()=>{
  for(const invalid of ['reference','chart'])await withMock(async(_url,options)=>{const body=JSON.parse(options?.body as string);if(body.stream)return streamReply('Readout.',[message('Readout.')]);const payload=result();if(invalid==='reference')payload.report={...demoReport,findings:[{...demoReport.findings[0],evidenceIds:['metric:fake']} ]};else payload.artifacts=[{title:'Unavailable',kind:'trend',metricId:'retention',evidenceIds:['metric:retention']}];return Response.json(response([message(JSON.stringify(payload))]));},async()=>{const out=await events(await POST(request()));assert.equal(out.filter(e=>e.type==='artifact').length,0);assert.equal(out.at(-1)?.type,'error');});
});
test('authentication and rate limits become actionable errors without exposing provider details',async()=>{
  for(const status of [401,429])await withMock(async()=>Response.json({error:{message:'upstream detail',type:'test'}},{status}),async()=>{const out=await events(await POST(request()));const last=out.at(-1);assert.equal(last?.type,'error');if(last?.type==='error'){assert.match(last.message,status===401?/authentication/:/rate-limited/);assert.doesNotMatch(last.message,/upstream detail/);}});
  assert.match(friendlyError(new DOMException('Aborted','AbortError')),/timed out or was cancelled/);
});
test('conflicting rollout decisions and mismatched chart evidence fail before publishing',async()=>{
  for(const invalid of ['rollout','chart-source'])await withMock(async(_url,options)=>{
    const body=JSON.parse(options?.body as string);
    if(body.stream)return streamReply('Readout.',[message('Readout.')]);
    const payload=result();
    if(invalid==='rollout')payload.report={...demoReport,recommendation:'ship'};
    else payload.artifacts[0].evidenceIds=['metric:activation'];
    return Response.json(response([message(JSON.stringify(payload))]));
  },async()=>{const out=await events(await POST(request()));assert.equal(out.filter(e=>e.type==='artifact').length,0);assert.equal(out.at(-1)?.type,'error');});
});
test('upstream timeout preserves streamed text and returns an actionable error',async()=>{
  await withMock(async(_url,options)=>{if(JSON.parse(options?.body as string).stream)return streamReply('Partial readout.',[message('Partial readout.')]);throw new DOMException('The operation timed out','TimeoutError');},async()=>{
    const out=await events(await POST(request()));const last=out.at(-1);
    assert.equal(last?.type,'error');if(last?.type==='error')assert.match(last.message,/timed out/);
    assert.equal(out.filter(e=>e.type==='artifact').length,0);assert.ok(out.some(e=>e.type==='delta'&&e.text==='Partial readout.'));
  });
});
test('cancelling a response aborts the upstream provider request',async()=>{
  let providerSignal:AbortSignal|undefined;let started:()=>void=()=>{};const ready=new Promise<void>(resolve=>{started=resolve;});
  await withMock(async(_url,options)=>{providerSignal=options?.signal as AbortSignal;started();return new Promise((_resolve,reject)=>providerSignal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));},async()=>{const res=await POST(request());const reader=res.body!.getReader();await ready;await reader.cancel();assert.equal(providerSignal?.aborted,true);});
});

test('node comments produce a validated downstream revision without replacing the report',async()=>{
  const {downstreamPathNodes}=await import('../lib/metis/path-reasoning');
  const data=getDataset('bebop-5pct');
  let calls=0;
  await withMock(async(_url,options)=>{
    const body=JSON.parse(options?.body as string);calls++;
    assert.match(body.instructions,/NODE REASONING TASK/);
    assert.match(body.instructions,/Never edit upstream or sibling nodes/);
    assert.match(body.instructions,/unverified context/);
    assert.ok(body.input.some((item:{content?:string})=>item.content==='Could latency explain this?'));
    if(body.stream)return streamReply('需要进一步验证 [source:P1]。',[message('需要进一步验证 [source:P1]。')]);
    assert.equal(body.text.format.name,'path_revision');
    return Response.json(response([message(JSON.stringify({summary:'下游假设仍需验证。',updates:downstreamPathNodes('f23').map(nodeId=>({nodeId,conclusion:'等待时间是待验证假设',reasoning:'现有材料没有提供相关分群的延迟数据。',state:'needs-data',evidenceIds:['source:P1']}))}))]));
  },async()=>{
    const out=await events(await POST(request({...requestBody(),mode:'chat',experimentId:data.experiment.id,snapshotId:data.experiment.snapshotId,config:data.defaultConfig,prompt:'Could latency explain this?',pathContext:{nodeId:'f23',current:[]}})));
    assert.equal(calls,2);assert.equal(out.at(-1)?.type,'done');
    const update=out.find(event=>event.type==='path-revision');
    assert.equal(update?.type==='path-revision'&&update.revision.nodeId,'f23');
    assert.equal(update?.type==='path-revision'&&update.revision.id,'test-run');
    assert.equal(out.filter(event=>event.type==='artifact').length,0);
  });
});

test('node requests reject wrong experiments and unknown nodes before calling the model',async()=>{
  const data=getDataset('bebop-5pct');
  await withMock(async()=>{throw new Error('Must not call provider');},async()=>{
    assert.equal((await POST(request({...requestBody(),mode:'chat',pathContext:{nodeId:'a12',current:[]}}))).status,400);
    for(const nodeId of ['missing','constructor'])assert.equal((await POST(request({...requestBody(),mode:'chat',experimentId:data.experiment.id,snapshotId:data.experiment.snapshotId,config:data.defaultConfig,pathContext:{nodeId,current:[]}}))).status,400);
  });
});

test('partial or off-path model revisions never publish graph updates',async()=>{
  const data=getDataset('bebop-5pct');
  for(const nodeId of ['a11','f23'])await withMock(async(_url,options)=>{
    const body=JSON.parse(options?.body as string);
    if(body.stream)return streamReply('Partial reasoning.',[message('Partial reasoning.')]);
    return Response.json(response([message(JSON.stringify({summary:'Invalid scope',updates:[{nodeId,conclusion:'Unverified',reasoning:'Insufficient data',state:'needs-data',evidenceIds:[]}]}))]));
  },async()=>{
    const out=await events(await POST(request({...requestBody(),mode:'chat',experimentId:data.experiment.id,snapshotId:data.experiment.snapshotId,config:data.defaultConfig,pathContext:{nodeId:'f23',current:[]}})));
    assert.equal(out.at(-1)?.type,'error');assert.equal(out.filter(event=>event.type==='path-revision'||event.type==='done').length,0);
  });
});
