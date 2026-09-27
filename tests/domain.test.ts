import test from 'node:test';
import assert from 'node:assert/strict';
import { addAction, changeValues, createBranch, createConversation, exportReport, metricState, updateBranch, validateReport } from '../lib/metis/domain';
import { defaultConfig, demoReport, initialWorkspace, metricById } from '../lib/metis/data';
import { configSchema } from '../lib/metis/agent-schema';
import { analysisModeIds, normalizeAnalysisConfig } from '../lib/metis/analysis-modes';
import type { AnalysisConfig } from '../lib/metis/types';

test('analysis modes validate strictly and older configurations keep the default',()=>{
  for(const analysisMode of analysisModeIds)assert.equal(configSchema.parse({...defaultConfig,analysisMode}).analysisMode,analysisMode);
  assert.equal(configSchema.safeParse({...defaultConfig,analysisMode:'invented-mode'}).success,false);
  const {analysisMode,...legacy}=defaultConfig;
  assert.equal(configSchema.parse(legacy).analysisMode,'scorecard-review');
  assert.equal(normalizeAnalysisConfig(legacy as AnalysisConfig).analysisMode,'scorecard-review');
  assert.equal(normalizeAnalysisConfig({...defaultConfig,analysisMode:'srm-investigation'}).analysisMode,'srm-investigation');
});

test('analysis mode is inherited and later changes preserve parent and existing artifacts',()=>{
  const state=initialWorkspace();
  state.branches[0].config.analysisMode='metric-analysis';
  const created=createBranch(state,state.branches[0],'Metric focus','Explore activation',['metric:activation']);
  assert.equal(created.branches[1].config.analysisMode,'metric-analysis');
  const next=updateBranch(created,created.branches[1].id,b=>({...b,config:{...b.config,analysisMode:'srm-investigation'}}));
  assert.equal(next.branches[0].config.analysisMode,'metric-analysis');
  assert.equal(next.branches[1].config.analysisMode,'srm-investigation');
  assert.equal(next.branches[0].artifacts[0].config?.analysisMode,'scorecard-review');
});

test('percentage-point and relative changes are distinct, including zero baseline',()=>{
  const c=changeValues(20,21);assert.equal(c.absolute,1);assert.equal(c.relative,5);assert.equal(changeValues(0,1).relative,null);
});
test('success and guardrail judgments account for confidence intervals',()=>{
  const config=structuredClone(defaultConfig);assert.equal(metricState(metricById.activation,config).label,'Target reached');
  config.thresholds.activation=2;assert.equal(metricState(metricById.activation,config).label,'Needs more evidence');
  assert.equal(metricState(metricById.latency,config).label,'Boundary exceeded');config.thresholds.latency=70;assert.equal(metricState(metricById.latency,config).label,'Boundary uncertain');
  assert.equal(metricState(metricById.sessions,config).label,'Inconclusive');
});
test('a branch inherits a snapshot and settings but cannot mutate its parent',()=>{
  const state=initialWorkspace();const original=structuredClone(state.branches[0]);const created=createBranch(state,state.branches[0],'Android follow-up','Investigate latency',['segment:latency']);
  const b=created.branches[1];b.config.thresholds.latency=100;b.messages.push({id:'test',role:'user',text:'Question',origin:'user',evidenceIds:[]});
  assert.equal(b.snapshotId,original.snapshotId);assert.equal(b.parentId,'main');assert.equal(b.artifacts.length,0);assert.deepEqual(state.branches[0],original);
  const next=updateBranch(created,b.id,branch=>({...branch,actions:[]}));assert.deepEqual(next.branches[0],original);
});
test('branch creation is idempotent and all analysis branches stay one level deep',()=>{
  let s=initialWorkspace();s=createBranch(s,s.branches[0],'Latency','Investigate',['segment:latency']);s=createBranch(s,s.branches[0],'Latency','Investigate',['segment:latency']);assert.equal(s.branches.length,2);
  s=createBranch(s,s.branches[1],'Follow-up','Other question',[]);assert.equal(s.branches[2].parentId,'main');
});
test('new group conversations preserve existing analyses and retain independent state after reload',()=>{
  const original=initialWorkspace();
  const config={...structuredClone(defaultConfig),requirements:'Investigate Android latency'};
  const first=createConversation(original,'conversation-1','Growth & activation',config);
  const second=createConversation(first,'conversation-2','Conversion',config);
  assert.deepEqual(second.branches[0],original.branches[0]);
  assert.equal(second.branches[1].groupName,'Growth & activation');
  assert.equal(second.branches[2].groupName,'Conversion');
  assert.equal(second.branches[2].messages[0].text,config.requirements);
  assert.equal(second.branches[2].artifacts.length,0);
  second.branches[2].config.thresholds.latency=120;
  second.branches[2].messages.push({id:'follow-up',role:'user',origin:'user',text:'Compare platforms',evidenceIds:[]});
  assert.equal(second.branches[1].config.thresholds.latency,50);
  assert.equal(second.branches[1].messages.length,1);
  const restored=JSON.parse(JSON.stringify(second));
  const retry=createConversation(restored,'conversation-2','Conversion',config);
  assert.deepEqual(retry,restored);
  assert.equal(retry.selectedBranchId,'conversation-2');
});
test('branches and duplicate detection are scoped to their own conversation',()=>{
  let state=createConversation(initialWorkspace(),'conversation-1','Growth & activation',defaultConfig);
  state=createBranch(state,state.branches[0],'Latency','Investigate',['segment:latency']);
  state=createBranch(state,state.branches[1],'Latency','Investigate',['segment:latency']);
  assert.equal(state.branches.length,4);
  assert.equal(state.branches[3].parentId,'conversation-1');
  state=createBranch(state,state.branches[3],'Follow-up','Other question',[]);
  assert.equal(state.branches[4].parentId,'conversation-1');
  assert.equal(state.branches[4].groupName,'Growth & activation');
});
test('repeated add-to-plan does not duplicate actions',()=>{
  const main=initialWorkspace().branches[0];const once=addAction(main,demoReport.findings[1]);const twice=addAction(once,demoReport.findings[1]);assert.equal(twice.actions.length,1);assert.equal(main.actions.length,0);
});
test('invalid evidence and missing target are rejected',()=>{
  assert.throws(()=>validateReport({...demoReport,findings:[{...demoReport.findings[0],evidenceIds:['metric:invented']}]}));
  assert.throws(()=>createBranch(initialWorkspace(),initialWorkspace().branches[0],'Bad','',['missing']));
  const config=structuredClone(defaultConfig);config.roles.activation='fundamental';assert.equal(configSchema.safeParse(config).success,false);
});
test('a rollout report cannot override a breached or uncertain guardrail',()=>{
  const ship={...demoReport,recommendation:'ship' as const};
  const config=structuredClone(defaultConfig);
  assert.throws(()=>validateReport(ship,config),/conflicts/);
  config.thresholds.latency=70;
  assert.throws(()=>validateReport(ship,config),/conflicts/);
  config.thresholds.latency=90;
  assert.equal(validateReport(ship,config).recommendation,'ship');
  config.thresholds.activation=3;
  assert.throws(()=>validateReport(ship,config),/conflicts/);
});
test('export includes source snapshot, units, uncertainty and action state',()=>{
  const b=addAction(initialWorkspace().branches[0],demoReport.findings[1]);const text=exportReport(b,demoReport);
  assert.match(text,/Synthetic|synthetic/);assert.match(text,/onboarding-2026-09-14-v1/);assert.match(text,/\+2\.7 pp/);assert.match(text,/\+8\.33%/);assert.match(text,/95% CI/);assert.match(text,/segment:latency/);assert.match(text,/- \[ \]/);
  assert.match(text,/-0\.025 to \+0\.045 pp/);
});
