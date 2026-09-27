import * as onboarding from './data';
import { bebopDataset } from './bebop-case';
import type { AnalysisBranch, AnalysisConfig, ExperimentDataset, Finding, Metric, MetricId, Report, Workspace } from './types';

export const onboardingDataset: ExperimentDataset = onboarding;
type Seed = {
  id: string; name: string; group: string; n: number; objective: string;
  primary: [string, number, number, number, number, number];
  latency: [string, number, number, number, number, number];
  errors: [string, number, number, number, number, number];
  retention: [number, number, number, number];
  sessions: [number, number, number, number];
  report: Omit<Report, 'limitations'>;
};

const finding=(title:string,body:string,tone:Finding['tone'],evidenceIds:string[],hypothesis:string,validation:string):Finding=>({title,body,tone,evidenceIds,hypothesis,validation});

const seeds: Seed[] = [
  {
    id:'invite-flow',name:'Invite flow',group:'Growth & activation',n:20000,
    objective:'Help invited teammates accept an invitation without adding friction or reducing reliability.',
    primary:['Invite acceptance rate',24,27,2.1,3.9,1],
    latency:['Invite page latency',610,616,-6,18,30],
    errors:['Invite error rate',0.8,0.78,-0.10,0.06,0.1],
    retention:[31.2,32,-0.1,1.7],sessions:[2.1,2.18,-0.02,0.18],
    report:{shortTitle:'Invite acceptance gains',headline:'More teammates accept. Ready for a careful rollout.',recommendation:'ship',summary:'Invite acceptance increases from 24% to 27%, a +3 pp / +12.5% lift. The target is reached and both guardrails stay within their boundaries. Roll out gradually while monitoring longer-term engagement.',findings:[
      finding('A clearer invitation brings more teammates in','Acceptance improves by 3 pp, with a 95% interval of +2.1 to +3.9 pp. This exceeds the minimum useful gain of 1 pp.','positive',['metric:activation','trend:activation'],'Clearer invitation copy may make the value of joining easier to understand.','Track invitation-to-join funnel steps during a staged rollout.'),
      finding('The gain fits within the performance budget','The observed latency change is +6 ms. Its interval of −6 to +18 ms remains within the +30 ms guardrail, and the error-rate boundary is also respected.','positive',['metric:latency','metric:crashes'],'The revised flow may add clarity without requiring expensive client work.','Monitor page latency and invitation errors at each rollout stage.'),
      finding('Longer-term engagement is still uncertain','Day 7 retention changes from 31.2% to 32%. The interval includes zero, so this does not establish a retention improvement or prove no effect.','neutral',['metric:retention'],'More accepted invitations may eventually create more active teams.','Collect additional matured cohorts and validate team-level engagement before making a retention claim.'),
    ]},
  },
  {
    id:'checkout-simplification',name:'Checkout simplification',group:'Conversion',n:30000,
    objective:'Increase completed checkouts while keeping checkout fast and reliable.',
    primary:['Checkout completion rate',62.4,65.2,2.04,3.56,1],
    latency:['Checkout latency',940,820,-148,-92,50],
    errors:['Checkout error rate',1.4,1.2,-0.38,-0.02,0.1],
    retention:[28.1,28.3,-0.72,1.12],sessions:[3.4,3.48,0,0.16],
    report:{shortTitle:'Faster checkout, more completions',headline:'Fewer steps. More completed checkouts.',recommendation:'ship',summary:'Checkout completion rises from 62.4% to 65.2%, a +2.8 pp / +4.49% lift. Checkout is also faster and less error-prone. The evidence supports a staged rollout, with continued monitoring across platforms.',findings:[
      finding('Completion clears the useful-gain threshold','The 95% interval for the +2.8 pp completion lift is +2.04 to +3.56 pp, above the 1 pp target.','positive',['metric:activation','trend:activation'],'Removing unnecessary fields may reduce abandonment.','Check step-level abandonment and compare returning and first-time shoppers in a follow-up.'),
      finding('Checkout gets faster and more reliable','Latency falls from 940 to 820 ms, and the checkout error rate falls from 1.4% to 1.2%. Both guardrails remain within their limits.','positive',['metric:latency','metric:crashes','segment:latency'],'Fewer transitions may reduce waiting and failure opportunities.','Monitor slower devices and error logs as traffic is increased.'),
      finding('More purchases do not yet establish durable engagement','Day 7 retention changes by +0.2 pp, with an interval from −0.72 to +1.12 pp. Longer-term effects remain uncertain.','neutral',['metric:retention'],'A smoother checkout may improve return visits, but the current data cannot establish that.','Collect matured cohorts and pre-register repeat-purchase outcomes.'),
    ]},
  },
  {
    id:'pricing-page-refresh',name:'Pricing page refresh',group:'Conversion',n:25000,
    objective:'Improve paid conversion through clearer pricing while preserving page performance and reliability.',
    primary:['Paid conversion rate',8.4,8.9,0.01,0.99,0.5],
    latency:['Pricing page latency',680,692,2,22,30],
    errors:['Pricing page error rate',0.32,0.31,-0.04,0.02,0.05],
    retention:[39.8,39.6,-1.41,1.01],sessions:[1.6,1.66,-0.01,0.13],
    report:{shortTitle:'Paid conversion gain uncertain',headline:'A promising conversion lift. Keep collecting evidence.',recommendation:'continue',summary:'Paid conversion moves from 8.4% to 8.9%, a +0.5 pp / +5.95% lift. The interval is still too wide to establish the minimum useful gain of 0.5 pp. Performance guardrails are within bounds; continue the experiment before deciding on rollout.',findings:[
      finding('The observed lift needs a more precise estimate','The conversion interval is +0.01 to +0.99 pp. It favors a positive effect, but its lower bound does not reach the +0.5 pp target.','neutral',['metric:activation','trend:activation'],'Clearer plan comparisons may help visitors choose a paid plan.','Continue to the pre-specified sample target and evaluate practical benefit alongside the confidence interval.'),
      finding('The refreshed page stays within its guardrails','Page latency increases by 12 ms, with a +2 to +22 ms interval under the +30 ms boundary. The page error-rate interval also stays within the agreed limit.','positive',['metric:latency','metric:crashes'],'Additional pricing content may have a small rendering cost.','Keep monitoring page load performance by platform during the remaining experiment.'),
      finding('Additional browsing is an exploratory signal','Sessions per user change from 1.6 to 1.66, with an interval that includes zero. This does not establish that visitors are either more engaged or more confused.','neutral',['metric:sessions'],'Visitors may be comparing plans more often before deciding.','Use plan-comparison events and usability interviews to distinguish useful exploration from confusion.'),
    ]},
  },
  {
    id:'payment-methods',name:'Payment methods',group:'Conversion',n:40000,
    objective:'Increase successful payments while preventing duplicate charges and preserving payment speed.',
    primary:['Payment success rate',91.4,93.1,1.33,2.07,0.5],
    latency:['Payment latency',1100,1120,-4,44,50],
    errors:['Duplicate charge rate',0.03,0.05,-0.008,0.048,0.015],
    retention:[34.6,34.8,-0.73,1.13],sessions:[4.1,4.14,-0.04,0.12],
    report:{shortTitle:'Payment gains, duplicate charge risk',headline:'More successful payments. Resolve the charge risk first.',recommendation:'iterate',summary:'Payment success rises from 91.4% to 93.1%, a +1.7 pp / +1.86% lift. The observed duplicate-charge increase exceeds the configured guardrail, with substantial uncertainty. Keep exposure limited while auditing the charge and retry paths.',findings:[
      finding('More people complete a payment','Payment success improves by 1.7 pp, with a +1.33 to +2.07 pp interval. The minimum useful gain of 0.5 pp is reached.','positive',['metric:activation','trend:activation'],'Additional payment options may recover otherwise unsuccessful purchases.','Verify the lift by payment method using method-level instrumentation in a follow-up.'),
      finding('Duplicate charges require investigation before expansion','The observed duplicate-charge rate rises from 0.03% to 0.05%, a +0.02 pp increase against a +0.015 pp boundary. Its −0.008 to +0.048 pp interval is uncertain and does not rule out material harm.','caution',['metric:crashes'],'The revised payment flow may interact with retry behavior; this is an unverified hypothesis.','Audit transaction idempotency and retry logs, and validate a fix before increasing exposure.'),
      finding('Payment latency remains inside the agreed budget','Latency changes by +20 ms, with a −4 to +44 ms interval inside the +50 ms boundary. Platform differences are exploratory, not proven causes.','positive',['metric:latency','segment:latency'],'The new payment options may add a small processing cost.','Monitor the slowest device and network combinations during the limited rollout.'),
    ]},
  },
];

function buildDataset(seed:Seed):ExperimentDataset {
  const experiment={id:seed.id,name:seed.name,group:seed.group,url:`https://experiments.example.com/${seed.id}`,snapshotId:`${seed.id}-2026-09-14-v1`,start:'Sep 1',end:'Sep 14, 2026',controlN:seed.n,treatmentN:seed.n,objective:seed.objective};
  // Metric IDs are stable schema slots; the primary outcome is named by each snapshot.
  const primary=(id:MetricId,row:Seed['primary'],unit:Metric['unit'],role:Metric['role'],direction:Metric['direction']):Metric=>({id,name:row[0],description:`${row[0]} for randomized users in ${seed.name}.`,unit,control:row[1],treatment:row[2],ci:[row[3],row[4]],threshold:row[5],role,direction});
  const metrics:Metric[]=[primary('activation',seed.primary,'%','target','up'),primary('latency',seed.latency,'ms','guardrail','down'),primary('crashes',seed.errors,'%','guardrail','down'),
    {id:'retention',name:'Day 7 retention',description:`Return rate among fully matured cohorts; ${seed.n/2} users per arm.`,unit:'%',control:seed.retention[0],treatment:seed.retention[1],ci:[seed.retention[2],seed.retention[3]],direction:'up',role:'fundamental',threshold:0},
    {id:'sessions',name:'Sessions per user',description:'Sessions per randomized user during the observation period.',unit:'/user',control:seed.sessions[0],treatment:seed.sessions[1],ci:[seed.sessions[2],seed.sessions[3]],direction:'up',role:'fundamental',threshold:0,unexpected:seed.id==='pricing-page-refresh'},
  ];
  const metricById=Object.fromEntries(metrics.map(m=>[m.id,m])) as Record<MetricId,Metric>;
  const defaultConfig:AnalysisConfig={analysisMode:'scorecard-review',objective:seed.objective,requirements:'',roles:Object.fromEntries(metrics.map(m=>[m.id,m.role])) as AnalysisConfig['roles'],thresholds:Object.fromEntries(metrics.map(m=>[m.id,m.threshold])) as AnalysisConfig['thresholds']};
  // Fixed illustrative daily records, centered on the stored aggregate values.
  const waves=[-0.7,0.2,-0.3,0.6,-0.1,0.5,-0.2,0.3,-0.6,0.1,-0.5,0.7,-0.4,0.4];
  const trends=Object.fromEntries(metrics.filter(m=>m.id!=='retention').map(m=>[m.id,waves.map((wave,i)=>({date:`Sep ${i+1}`,control:Number((m.control+wave*m.control*0.012).toFixed(4)),treatment:Number((m.treatment+waves[13-i]*m.treatment*0.014).toFixed(4))}))]));
  const weights=[0.5,0.25,0.15,0.1],offsets=[1,-0.5,-1,-2.25],lift=[1.2,1.1,0.5,0.5];
  const segments=['Desktop','iOS','Android · higher-end','Android · lower-end'].map((name,i)=>({id:['desktop','ios','android-high','android-low'][i],name,n:seed.n*weights[i],activation:[seed.primary[1]+offsets[i],seed.primary[1]+offsets[i]+(seed.primary[2]-seed.primary[1])*lift[i]],latency:[seed.latency[1]*(1+[-0.15,0.02,0.15,0.475][i]),seed.latency[1]*(1+[-0.15,0.02,0.15,0.475][i])+(seed.latency[2]-seed.latency[1])*[0.6,1,1.4,2.4][i]],note:'Exploratory platform comparison',tone:'neutral'}));
  const evidence=onboarding.evidence.map(ref=>({...ref,title:ref.kind==='metric'?metricById[ref.metricId].name:ref.kind==='trend'?`${metricById[ref.metricId].name} · daily trend`:`${metricById[ref.metricId].name} by platform`}));
  return {experiment,metrics,metricById,defaultConfig,trends,segments,evidence,evidenceById:Object.fromEntries(evidence.map(ref=>[ref.id,ref])),demoReport:{...seed.report,limitations:['All values are synthetic demonstration data with precomputed confidence intervals and illustrative daily trends.','Platform breakdowns are exploratory; interaction tests and segment confidence intervals are unavailable.','Retention uses matured cohorts. A non-significant result does not establish no effect. Unexpected findings are not adjusted for multiple comparisons.']}};
}

export const datasets:ExperimentDataset[]=[onboardingDataset,...seeds.map(buildDataset),bebopDataset];
export const datasetById=Object.fromEntries(datasets.map(data=>[data.experiment.id,data]));
export function getDataset(id=onboarding.experiment.id):ExperimentDataset {const data=Object.hasOwn(datasetById,id)?datasetById[id]:undefined;if(!data)throw new Error('Unknown experiment snapshot');return data;}
export function datasetForUrl(value:string){try{const url=new URL(value);return datasets.find(d=>d.experiment.url===url.origin+url.pathname.replace(/\/$/,''));}catch{return undefined;}}
export const sessionIdForExperiment=(id:string)=>id===onboarding.experiment.id?'main':`session-${id}`;

function preparedSession(data:ExperimentDataset):AnalysisBranch {
  const {experiment,defaultConfig,demoReport,evidence}=data;const id=sessionIdForExperiment(experiment.id);
  if(data.caseStudy)return {id,experimentId:experiment.id,parentId:null,groupName:experiment.group,name:experiment.name,snapshotId:experiment.snapshotId,context:'Reconstruct Jing and Lan Mi’s investigation from supplied sources, preserving corrections and unresolved hypotheses.',evidenceIds:[],config:structuredClone(defaultConfig),actions:[],runs:[],artifacts:[{id:`${id}-report`,title:'Bebop investigation',kind:'report',metricId:'activation',evidenceIds:evidence.map(ref=>ref.id),origin:'source',config:structuredClone(defaultConfig),report:structuredClone(demoReport)}],messages:[{id:`${id}-source-note`,role:'assistant',origin:'source',text:'This investigation is reconstructed from Jing’s supplied PPT and conversation screenshots. Open the report to follow the evidence, corrections, hypotheses and original hold-at-5% recommendation. No raw event data or follow-up outcome was supplied.',evidenceIds:['source:P1','source:S04','source:P3-image'],status:'complete'}]};
  return {id,experimentId:experiment.id,parentId:null,groupName:experiment.group,name:experiment.name,snapshotId:experiment.snapshotId,context:'',evidenceIds:[],config:structuredClone(defaultConfig),actions:[],runs:[],
    artifacts:[{id:`${id}-report`,title:'Experiment report',kind:'report',metricId:'activation',evidenceIds:evidence.map(ref=>ref.id),origin:'demo',config:structuredClone(defaultConfig),report:structuredClone(demoReport)}],
    messages:[
      {id:`${id}-request`,role:'user',origin:'demo',text:`Analyze ${experiment.name} and recommend the next step.`,evidenceIds:[],status:'complete'},
      {id:`${id}-answer`,role:'assistant',origin:'demo',text:`${demoReport.summary}\n\n${demoReport.findings[0].body}`,evidenceIds:demoReport.findings.flatMap(f=>f.evidenceIds).filter((id,i,all)=>all.indexOf(id)===i),status:'complete'},
      {id:`${id}-follow-up`,role:'user',origin:'demo',text:'What should we validate next?',evidenceIds:[],status:'complete'},
      {id:`${id}-next-step`,role:'assistant',origin:'demo',text:demoReport.findings.map(f=>f.validation).join('\n\n'),evidenceIds:demoReport.findings.flatMap(f=>f.evidenceIds).filter((id,i,all)=>all.indexOf(id)===i),status:'complete'},
    ],
  };
}

// Add missing prepared sessions without resetting saved conversations or analysis results.
export function seedWorkspace(workspace:Workspace):Workspace {
  const missing=datasets.filter(data=>!workspace.branches.some(b=>b.id===sessionIdForExperiment(data.experiment.id))).map(preparedSession);
  return missing.length?{...workspace,branches:[...workspace.branches,...missing]}:workspace;
}
