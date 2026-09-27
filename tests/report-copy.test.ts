import test from 'node:test';
import assert from 'node:assert/strict';
import { demoReport, initialWorkspace } from '../lib/metis/data';
import { datasets, getDataset, onboardingDataset, seedWorkspace } from '../lib/metis/datasets';
import { exportReport } from '../lib/metis/domain';
import { findingReadout, metricConclusion, recommendationTitle, objectiveHeadline, reportReadout, trendConclusion } from '../lib/metis/report-copy';
import { organizeReport } from '../lib/metis/report-sections';

test('saved demo copy derives exact results without changing artifact or finding identities',()=>{
  const branch=initialWorkspace().branches[0], before=structuredClone(branch);
  const readout=reportReadout(branch.artifacts[0].report!,onboardingDataset,branch.config,'demo');
  assert.equal(readout.headline,'The refresh meets the activation goal, but observed latency exceeds the budget.');
  assert.match(readout.summary,/32.4% → 35.1% \(\+2.7 pp \/ \+8.33%\)/);
  assert.match(readout.summary,/50 ms limit by 14 ms/);
  assert.match(readout.summary,/24.8% → 23.7% \(-1.1 pp \/ -4.44%\)/);
  assert.match(readout.summary,/Next: Profile/);
  assert.match(readout.findings[0].body,/26.95% → 28.7% \(\+1.75 pp; 2,400 users per arm\)/);
  assert.match(readout.findings[1].body,/1,240 ms → 1,438 ms \(\+198 ms; 2,400 users per arm\)/);
  assert.deepEqual(branch,before);
  assert.deepEqual(readout.findings.map(f=>f.evidenceIds),before.artifacts[0].report!.findings.map(f=>f.evidenceIds));
});

test('every demo and section has dataset-specific conclusions rather than template questions',()=>{
  for(const data of datasets.filter(data=>!data.caseStudy)){
    const readout=reportReadout(data.demoReport,data,data.defaultConfig,'demo');
    assert.ok(readout.headline.includes(data.metricById.activation.name.toLowerCase().replace(/ rate$/, '')));
    assert.doesNotMatch(readout.headline,/[+-]\d|\bpp\b|\bms\b/);
    assert.doesNotMatch(readout.headline,/What changed|stronger start|What comes next/i);
    assert.ok(readout.findings.every(f=>/95% CI/.test(f.body)&&/\d/.test(f.title)));
    const sections=organizeReport(data,data.defaultConfig,data.demoReport);
    for(const section of sections.filter(s=>s.metrics.length)){
      assert.match(section.description,/\d/);
      assert.ok(section.metrics.every(m=>section.description.includes(m.name)));
      assert.ok(!section.description.endsWith('?'));
    }
    if(data!==onboardingDataset)assert.doesNotMatch(readout.summary,/Onboarding latency|Activation rate|12,000/);
  }
});

test('conclusions respect historical thresholds, small guardrails, and uncertainty',()=>{
  const data=onboardingDataset, config=structuredClone(data.defaultConfig);
  config.thresholds.activation=2;
  assert.match(metricConclusion(data.metricById.activation,config),/lower-bound benefit is \+1.85 pp.*2 pp minimum gain is not established/);
  config.thresholds.latency=70;
  assert.match(metricConclusion(data.metricById.latency,config),/up to 86 ms degradation against a 70 ms limit/);
  assert.doesNotMatch(recommendationTitle(demoReport,data,config),/exceeds/);
  const payment=getDataset('payment-methods');
  assert.match(metricConclusion(payment.metricById.crashes,payment.defaultConfig),/0.015 pp limit by 0.005 pp/);
  assert.match(metricConclusion(payment.metricById.crashes,payment.defaultConfig),/spans the limit/);
  const pricing=getDataset('pricing-page-refresh');
  assert.match(findingReadout(pricing.demoReport.findings[2],pricing,pricing.defaultConfig).body,/includes zero; the effect remains uncertain/);
});

test('trend descriptions use the actual daily range and never invent missing series',()=>{
  assert.match(trendConclusion('activation',onboardingDataset),/higher on all 14 displayed days/);
  assert.match(trendConclusion('activation',onboardingDataset),/\+1.1 to \+3.5 pp/);
  assert.match(trendConclusion('retention',onboardingDataset),/no daily series/);
  const checkout=getDataset('checkout-simplification');
  assert.match(trendConclusion('latency',checkout),/lower on all 14 displayed days/);
  assert.match(trendConclusion('latency',checkout),/does not establish a time-dependent effect/);
});

test('export and display share numeric copy while genuine model reports retain their interpretation',()=>{
  const workspace=seedWorkspace(initialWorkspace());
  for(const branch of workspace.branches){
    const data=getDataset(branch.experimentId), original=branch.artifacts[0].report!;
    const readout=reportReadout(original,data,branch.config,'demo');
    const markdown=exportReport(branch,original);
    assert.ok(markdown.includes(readout.headline)&&markdown.includes(readout.summary));
    assert.ok(readout.findings.every(f=>markdown.includes(f.body)));
    if(data.trends.activation)assert.ok(markdown.includes(trendConclusion('activation',data)));
    assert.equal(reportReadout(original,data,branch.config,'ai'),original);
  }
});


test('objective headlines distinguish unmet targets, uncertain costs and safe gains',()=>{
  const data=onboardingDataset, config=structuredClone(data.defaultConfig);
  config.thresholds.activation=2;
  assert.match(objectiveHeadline(data,config),/has not yet established the required gain in activation/);
  assert.doesNotMatch(objectiveHeadline(data,config),/meets the activation goal/);
  config.thresholds.activation=1;
  config.thresholds.latency=70;
  assert.match(objectiveHeadline(data,config),/guardrail remains uncertain/);
  config.roles.sessions='target';
  assert.match(objectiveHeadline(data,config),/has not yet established the required gain in sessions per user/);
  const invite=getDataset('invite-flow');
  assert.match(objectiveHeadline(invite,invite.defaultConfig),/meets the invite acceptance goal while staying within its guardrails/);
  const pricing=getDataset('pricing-page-refresh');
  assert.match(objectiveHeadline(pricing,pricing.defaultConfig),/has not yet established the required gain in paid conversion/);
  const payment=getDataset('payment-methods');
  assert.match(objectiveHeadline(payment,payment.defaultConfig),/meets the payment success goal, but observed duplicate charge rate exceeds its limit/);
});
