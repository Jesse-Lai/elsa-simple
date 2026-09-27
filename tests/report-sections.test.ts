import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfig, demoReport, initialWorkspace } from '../lib/metis/data';
import { datasets, getDataset, onboardingDataset, seedWorkspace } from '../lib/metis/datasets';
import { exportReport, metricInterpretation, metricRule } from '../lib/metis/domain';
import { findingPopulation, organizeReport } from '../lib/metis/report-sections';
import type { Report } from '../lib/metis/types';

test('old saved reports render four dimensions without migrating or mutating history', () => {
  const saved=JSON.parse(JSON.stringify(seedWorkspace(initialWorkspace())));
  const before=structuredClone(saved);
  for(const branch of saved.branches){
    const data=getDataset(branch.experimentId);
    const report=branch.artifacts[0].report;
    const sections=organizeReport(data,branch.artifacts[0].config,report);
    assert.deepEqual(sections.map(s=>s.id),['target','guardrail','fundamental','unexpected']);
    const findings=sections.flatMap(s=>s.findings);
    assert.equal(findings.length,report.findings.length);
    assert.equal(new Set(findings).size,findings.length);
    assert.deepEqual(sections[0].metrics.map(m=>m.id),['activation']);
    assert.deepEqual(sections[1].metrics.map(m=>m.id),['latency','crashes']);
  }
  assert.deepEqual(saved,before);
});

test('unexpected remains a flag while configured metric roles control the sections', () => {
  const config=structuredClone(defaultConfig);
  config.roles.activation='fundamental';
  config.roles.latency='target';
  config.roles.retention='guardrail';
  const sections=organizeReport(onboardingDataset,config,demoReport);
  assert.deepEqual(sections[0].metrics.map(m=>m.id),['latency']);
  assert.deepEqual(sections[0].findings,[demoReport.findings[1]]);
  assert.ok(sections[2].metrics.some(m=>m.id==='activation'));
  assert.deepEqual(sections[2].findings,[demoReport.findings[0]]);
  assert.ok(sections[1].metrics.some(m=>m.id==='retention'));
  assert.deepEqual(sections[3].metrics.map(m=>m.id),['retention']);
  assert.deepEqual(sections[3].findings,[demoReport.findings[2]]);
});

test('excluded and unavailable evidence does not create orphan findings or extra categories', () => {
  const config=structuredClone(defaultConfig);
  config.roles.retention='excluded';
  const report:Report={...demoReport,findings:[...demoReport.findings,{...demoReport.findings[0],evidenceIds:['unknown','toString']}]};
  const sections=organizeReport(onboardingDataset,config,report);
  assert.ok(sections.every(s=>s.metrics.every(m=>m.id!=='retention')));
  assert.equal(sections.flatMap(s=>s.findings).length,2);
  assert.equal(sections[3].metrics.length,0);
  assert.match(sections[3].empty,/Other effects may still exist/);
});

test('mixed findings use their first included citation without repeating narrative', () => {
  const finding={...demoReport.findings[0],evidenceIds:['unknown','metric:activation','metric:latency']};
  const config=structuredClone(defaultConfig);
  let sections=organizeReport(onboardingDataset,config,{...demoReport,findings:[finding]});
  assert.deepEqual(sections[0].findings,[finding]);
  assert.equal(sections.flatMap(s=>s.findings).length,1);
  config.roles.activation='excluded';
  sections=organizeReport(onboardingDataset,config,{...demoReport,findings:[finding]});
  assert.deepEqual(sections[1].findings,[finding]);
});

test('unexpected population descriptions distinguish aggregate evidence from exploratory segments', () => {
  assert.match(findingPopulation(demoReport.findings[2],onboardingDataset),/12,000 users per arm/);
  assert.match(findingPopulation(demoReport.findings[2],onboardingDataset),/Affected subgroups cannot be identified/);
  assert.match(findingPopulation(demoReport.findings[1],onboardingDataset),/exploratory and do not establish a cause/);
  assert.match(findingPopulation({...demoReport.findings[0],evidenceIds:['unknown']},onboardingDataset),/cannot be determined/);
});

test('report export follows the same sections, rules and dataset evidence as the UI', () => {
  const workspace=seedWorkspace(initialWorkspace());
  for(const data of datasets.filter(data=>!data.caseStudy)){
    const branch=workspace.branches.find(b=>b.experimentId===data.experiment.id)!;
    const markdown=exportReport(branch,branch.artifacts[0].report);
    assert.deepEqual([...markdown.matchAll(/^## (.*metrics)$/gm)].map(match=>match[1]),['Target metrics','Guardrail metrics','Fundamental metrics','Unexpected metrics']);
    assert.ok(markdown.indexOf('## Recommendation')<markdown.indexOf('## Target metrics'));
    for(const match of markdown.matchAll(/(?:metric|trend|segment):[a-z]+/g))assert.ok(Object.hasOwn(data.evidenceById,match[0]));
    if(!data.metrics.some(m=>m.unexpected))assert.match(markdown,/No unexpected changes are flagged.*Other effects may still exist/);
  }
  const payment=getDataset('payment-methods');
  assert.equal(metricRule(payment.metricById.crashes,payment.defaultConfig),'Allow at most 0.015 pp increase');
  const markdown=exportReport(workspace.branches[0],demoReport);
  assert.match(markdown,/Increase by at least 1 pp/);
  assert.match(markdown,/Allow at most 50 ms increase/);
  assert.match(markdown,/Affected population:/);
  assert.match(markdown,/Hypothesis:/);
  assert.match(markdown,/Validation:/);
});

test('direction and uncertainty language reflects the configured decision boundaries', () => {
  const {metricById}=onboardingDataset;
  const config=structuredClone(defaultConfig);
  config.roles.latency='target';
  assert.equal(metricRule(metricById.latency,config),'Decrease by at least 50 ms');
  assert.match(metricInterpretation(metricById.latency,config),/not established/);
  config.roles.activation='guardrail';
  assert.equal(metricRule(metricById.activation,config),'Allow at most 1 pp decrease');
  assert.match(metricInterpretation(metricById.activation,config),/within the allowed boundary/);
  config.roles.latency='guardrail';
  config.thresholds.latency=70;
  assert.match(metricInterpretation(metricById.latency,config),/includes harm beyond/);
  assert.match(metricInterpretation(metricById.sessions,config),/includes zero; the effect remains uncertain/);
});
