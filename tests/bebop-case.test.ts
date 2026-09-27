import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { bebopCase, bebopDataset } from '../lib/metis/bebop-case';
import { caseDelta, caseRelative, caseSignal, exportCaseStudy } from '../lib/metis/case-study';
import { readCaseEvidence, caseInstructions } from '../lib/metis/case-agent';
import { initialWorkspace } from '../lib/metis/data';
import { getDataset, seedWorkspace } from '../lib/metis/datasets';
import { addAction, createBranch, exportReport, metricState, validateReport } from '../lib/metis/domain';
import { selectedExperiment } from '../lib/metis/experiment-catalog';
import { caseDeltaPoints, casePairPoints, caseRateBarDomain } from '../lib/metis/case-chart-data';

test('visualization axes preserve absolute changes, raw cohort rates, windows and compatible units',()=>{
  const metric=(id:string)=>bebopCase.metrics.find(m=>m.id===id)!;
  const points=caseDeltaPoints([metric('active-sessions'),metric('message-dau')]);
  assert.ok(Math.abs(points[0].change-1.67)<1e-10);
  assert.ok(Math.abs(points[1].change+.47)<1e-10);
  assert.equal(points[0].metric.window,metric('active-sessions').window);
  assert.equal(points[1].tone,'negative');
  const cancel=casePairPoints([metric('zq-cancel'),metric('non-zq-cancel')]);
  assert.deepEqual(cancel.map(p=>[p.control,p.treatment]),[[4.87,8.06],[1.11,1.83]]);
  assert.throws(()=>caseDeltaPoints([metric('sessions-per-user')]),/percentage metrics/);
  assert.throws(()=>casePairPoints([metric('early-sat')]),/percentage metrics/);
  const simple=caseDeltaPoints([{...metric('active-sessions'),control:20,treatment:21}])[0];
  assert.equal(simple.change,1);
  assert.equal(caseRelative(simple.metric),'+5%');
});

test('rate bars start at zero and include both observations within labeled percentage domains',()=>{
  const metric=bebopCase.metrics.find(m=>m.id==='active-sessions')!;
  assert.deepEqual(caseRateBarDomain(metric),[0,35]);
  for(const m of bebopCase.metrics.filter(m=>m.unit==='%')){
    const [low,high]=caseRateBarDomain(m);
    assert.equal(low,0,m.id);
    assert.ok(high<=100&&low<high,m.id);
    assert.ok(low<=Math.min(m.control,m.treatment)&&high>=Math.max(m.control,m.treatment),m.id);
    assert.notEqual(low.toFixed(2),high.toFixed(2));
  }
  for(const value of [0,20,100]){
    const [low,high]=caseRateBarDomain({...metric,control:value,treatment:value});
    assert.equal(low,0);
    assert.ok(low<=value&&high>=value&&low<high);
    assert.notEqual(low.toFixed(2),high.toFixed(2));
  }
  assert.throws(()=>caseRateBarDomain({...metric,unit:'s'}),/percentage metrics/);
});

test('visual signals follow metric benefit, while sparse feedback and flat estimates stay neutral',()=>{
  const metric=(id:string)=>bebopCase.metrics.find(m=>m.id===id)!;
  assert.equal(caseSignal(metric('active-sessions')).tone,'positive');
  for(const id of ['message-dau','app-reliability','early-sat','stop-generating','early-dsat','zq-cancel','non-zq-cancel'])assert.equal(caseSignal(metric(id)).tone,'negative',id);
  assert.equal(caseSignal(metric('early-thumbs')).label,'Inconclusive');
  assert.equal(caseSignal(metric('uplt')).label,'No observed change');
  assert.equal(caseSignal({...metric('stop-generating'),treatment:1}).tone,'positive');
});

test('Bebop preserves source windows, source values and rounding conflicts without inventing precision',()=>{
  const metric=(id:string)=>bebopCase.metrics.find(m=>m.id===id)!;
  assert.equal(caseDelta(metric('active-sessions')),'+1.67 pp');
  assert.equal(caseDelta(metric('zq-cancel')),'+3.19 pp');
  assert.equal(caseRelative(metric('non-zq-cancel')),'+64.86%');
  assert.equal(caseRelative(metric('stop-generating')),'+37.69%');
  assert.equal(metric('stop-generating').reportedRelative,38.2);
  assert.deepEqual([metric('prompting').control,metric('prompting').treatment],[38.46,39.88]);
  assert.match(metric('prompting').note,/42% versus 2.33%/);
  assert.notEqual(metric('early-dau').window,metric('message-dau').window);
  assert.match(metric('app-reliability').window,/window not shown/);
  assert.equal(bebopDataset.metrics.every(m=>m.ci===null&&m.threshold===null),true);
  assert.deepEqual(bebopDataset.trends,{});
  assert.deepEqual(bebopDataset.segments,[]);
  assert.equal(metricState(bebopDataset.metricById.activation,bebopDataset.defaultConfig).tone,'neutral');
  assert.throws(()=>validateReport({...bebopDataset.demoReport,recommendation:'ship'},bebopDataset.defaultConfig,bebopDataset),/no evidence supporting expansion/);
});

test('every case record and investigation cites a present local source',()=>{
  const ids=new Set(bebopCase.sources.map(s=>s.id));
  for(const item of [...bebopCase.metrics,...bebopCase.steps,...bebopCase.hypotheses,...bebopCase.plans]){
    assert.ok(item.sourceIds.length>0);
    assert.ok(item.sourceIds.every(id=>ids.has(id)));
  }
  for(const source of bebopCase.sources)assert.ok(existsSync(`public/cases/bebop/${source.file}`),source.file);
  assert.equal(selectedExperiment('PR179825216')?.id,bebopCase.id);
  assert.equal(selectedExperiment('PR1798252C15')?.id,bebopCase.id);
  assert.equal(getDataset(bebopCase.id),bebopDataset);
});

test('source-only tools expose missing data, corrections and unvalidated plans explicitly',()=>{
  assert.deepEqual(readCaseEvidence(bebopCase,'metrics','raw-events'),{unavailable:true,reason:'This record is not present in the supplied case. No missing measurements may be inferred.'});
  assert.throws(()=>readCaseEvidence(bebopCase,'trend','all'),/Invalid case evidence kind/);
  assert.match(JSON.stringify(readCaseEvidence(bebopCase,'hypotheses','H2')),/Non-ZQ cancellation/);
  const instructions=caseInstructions(bebopDataset,bebopDataset.defaultConfig,'Cancel follow-up',['source:S05']);
  assert.match(instructions,/REAL SOURCE-REPORTED OBSERVATIONS/);
  assert.match(instructions,/No numerical decision boundaries or CIs were supplied/);
  assert.match(instructions,/Cancel follow-up/);
  assert.doesNotMatch(instructions,/All experiment data is SYNTHETIC|onboarding-refresh|48,000/);
});

test('source sessions and branches persist independently with honest provenance and complete export',()=>{
  const original=initialWorkspace(),state=seedWorkspace(original);
  assert.deepEqual(state.branches[0],original.branches[0]);
  const main=state.branches.find(b=>b.experimentId===bebopCase.id)!;
  assert.equal(main.artifacts[0].origin,'source');
  assert.ok(main.messages.every(m=>m.origin==='source'));
  let next=createBranch(state,main,'Cancellation mechanisms','Compare ZQ and non-ZQ',['segment:crashes','source:S05']);
  const branch=next.branches.at(-1)!;
  assert.equal(branch.experimentId,bebopCase.id);
  assert.equal(branch.messages[0].origin,'source');
  assert.equal(branch.config.thresholds.crashes,0);
  assert.deepEqual(seedWorkspace(JSON.parse(JSON.stringify(next))),next);
  next=createBranch(next,main,'Cancellation mechanisms','Compare ZQ and non-ZQ',['segment:crashes','source:S05']);
  assert.equal(next.branches.length,state.branches.length+1);
  const action=addAction(main,bebopDataset.demoReport.findings[1]);
  assert.equal(addAction(action,bebopDataset.demoReport.findings[1]).actions.length,1);
  const md=exportReport(main,main.artifacts[0].report);
  assert.equal(md,exportCaseStudy(bebopCase,main,main.artifacts[0].report));
  for(const part of ['Investigation path','Hypotheses','Next steps','Limitations','source:S04','+37.69%','+38.2%','Hold at 5%'])assert.ok(md.includes(part),part);
  assert.doesNotMatch(md,/synthetic demonstration|Onboarding|32.4%|Lower-end Android/);
  assert.ok(main.artifacts[0].report!.findings.every(f=>md.includes(f.body)));
});
