import test from 'node:test';
import assert from 'node:assert/strict';
import { initialWorkspace } from '../lib/metis/data';
import { datasets, datasetForUrl, getDataset, seedWorkspace, sessionIdForExperiment } from '../lib/metis/datasets';
import { addAction, createBranch, createConversation, evidenceArtifact, exportReport, metricState, updateBranch, validEvidence, validateReport } from '../lib/metis/domain';

test('saved workspaces gain all registered prepared sessions without resetting existing work',()=>{
  let old=initialWorkspace();
  old.branches[0]=addAction(old.branches[0],old.branches[0].artifacts[0].report!.findings[0]);
  old=createConversation(old,'user-conversation','My group',old.branches[0].config);
  const before=structuredClone(old);
  const migrated=seedWorkspace(old);
  assert.deepEqual(migrated.branches.slice(0,before.branches.length),before.branches);
  assert.equal(migrated.selectedBranchId,'user-conversation');
  for(const dataset of datasets){
    const session=migrated.branches.find(b=>b.id===sessionIdForExperiment(dataset.experiment.id))!;
    assert.equal(session.experimentId,dataset.experiment.id);
    assert.equal(session.snapshotId,dataset.experiment.snapshotId);
    assert.ok(session.artifacts.some(a=>a.kind==='report'&&a.report));
    assert.ok(session.messages.some(m=>m.role==='assistant'&&m.text));
  }
  assert.equal(migrated.branches.filter(b=>!b.parentId).length,datasets.length+1);
  assert.deepEqual(seedWorkspace(JSON.parse(JSON.stringify(migrated))),migrated);
});

test('every saved report resolves its own metric names, evidence and export',()=>{
  const state=seedWorkspace(initialWorkspace());
  for(const data of datasets){
    const branch=state.branches.find(b=>b.experimentId===data.experiment.id)!;
    const report=branch.artifacts[0].report!;
    assert.equal(validateReport(report,branch.config,data),report);
    assert.equal(evidenceArtifact('metric:activation',data).title,data.metricById.activation.name);
    assert.equal(validEvidence(['toString'],data),false);
    assert.throws(()=>evidenceArtifact('toString',data),/Unknown evidence/);
    const markdown=exportReport(branch,report);
    assert.ok(markdown.includes(data.experiment.name));
    assert.ok(markdown.includes(data.experiment.snapshotId));
    assert.ok(markdown.includes(data.metricById.activation.name));
    assert.ok(branch.messages.every(m=>m.evidenceIds.every(id=>Object.hasOwn(data.evidenceById,id))));
    if(data.experiment.id!=='onboarding-refresh')assert.doesNotMatch(markdown,/Onboarding|Activation rate/);
  }
  const pricing=getDataset('pricing-page-refresh');
  assert.equal(metricState(pricing.metricById.activation,pricing.defaultConfig).tone,'neutral');
  const payment=getDataset('payment-methods');
  assert.equal(metricState(payment.metricById.crashes,payment.defaultConfig).tone,'caution');
});

test('new session datasets are internally consistent across aggregate and platform data',()=>{
  for(const data of datasets.slice(1).filter(data=>!data.caseStudy)){
    assert.equal(data.segments.reduce((n,s)=>n+s.n,0),data.experiment.controlN);
    for(const slot of ['activation','latency'] as const){
      for(const [index,arm] of ['control','treatment'].entries()){
        const weighted=data.segments.reduce((sum,s)=>sum+s[slot][index]*s.n,0)/data.experiment.controlN;
        assert.ok(Math.abs(weighted-data.metricById[slot][arm as 'control'|'treatment'])<1e-8);
      }
    }
    assert.equal(data.trends.activation?.length,14);
    assert.equal(data.trends.retention,undefined);
    assert.equal(datasetForUrl(`${data.experiment.url}/?source=demo`),data);
  }
  assert.equal(datasetForUrl('https://unknown.example/experiment'),undefined);
  assert.throws(()=>getDataset('unknown'),/Unknown/);
  assert.throws(()=>getDataset('constructor'),/Unknown/);
});

test('session and branch changes stay isolated and keep the selected experiment after reload',()=>{
  const data=getDataset('pricing-page-refresh');
  let state=seedWorkspace(initialWorkspace());
  const original=structuredClone(state);
  state=createConversation(state,'pricing-question','Conversion',{...data.defaultConfig,requirements:'Explain conversion uncertainty'},data);
  const conversation=state.branches.at(-1)!;
  assert.equal(conversation.experimentId,data.experiment.id);
  assert.equal(conversation.snapshotId,data.experiment.snapshotId);
  state=createBranch(state,conversation,'Conversion uncertainty','Check the target',['metric:activation']);
  const branch=state.branches.at(-1)!;
  assert.equal(branch.parentId,'pricing-question');
  assert.equal(branch.snapshotId,data.experiment.snapshotId);
  state=updateBranch(state,branch.id,b=>addAction({...b,config:{...b.config,thresholds:{...b.config.thresholds,activation:0.2}}},data.demoReport.findings[0]));
  assert.deepEqual(state.branches.slice(0,original.branches.length),original.branches);
  assert.equal(conversation.config.thresholds.activation,0.5);
  const restored=seedWorkspace(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored,state);
  assert.equal(restored.selectedBranchId,branch.id);
});
