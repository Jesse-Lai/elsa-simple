// Content and explicit relationships ported from bebop-analysis-map/dist/app.js.
export type PathColor = 'dau' | 'sat' | 'zq' | 'neutral' | 'experiment' | 'continuation';
export type PathNode = {
  id: string; type: 'metric' | 'hypothesis' | 'hypothesis missing' | 'finding' | 'action';
  column: 'observation' | 'hypothesis' | 'action'; y: number; h: number;
  title: string; trend?: string; detail?: string; color?: string; ref?: string;
  status?: 'confirmed' | 'pending' | 'experiment';
};
export type AnalysisRound = {
  id: string; title: string; height: number; nodes: PathNode[];
  edges: [string, string, PathColor][]; centerObservations?: boolean;
  alignments?: [string, string][]; notes?: {y:number; text:string}[];
};
export type Continuation = {from: string | string[]; to:string; lane:number; returnLane:number; gapOffset:number};

export const pathColors = {dau:'var(--chart-1)',sat:'var(--viz-negative)',zq:'var(--chart-3)',neutral:'var(--muted-foreground)',experiment:'var(--chart-1)',continuation:'var(--viz-caution)'};
export const pathColumns = {observation:{x:2.4,w:17.8},hypothesis:{x:28,w:27.1},action:{x:62,w:33.7}};
export const analysisRounds: AnalysisRound[] = [
  {id:'round-1',title:'第1轮分析',height:516,nodes:[
    {id:'dau',type:'metric',column:'observation',y:78,h:100,title:'Message DAU',trend:'↓',detail:'消息活跃用户下降',color:pathColors.dau},
    {id:'zq',type:'metric',column:'observation',y:248,h:110,title:'ZQ 点击',trend:'↑',detail:'点击增加',color:pathColors.zq},
    {id:'sat',type:'metric',column:'observation',y:378,h:100,title:'SAT Rate',trend:'↓',detail:'满意度下降',color:pathColors.sat},
    {id:'h11',type:'hypothesis',column:'hypothesis',y:28,h:100,ref:'H1.1',title:'Treatment / Control 反了？',color:pathColors.dau},
    {id:'h12',type:'hypothesis',column:'hypothesis',y:148,h:100,ref:'H1.2',title:'时间太短 / 包含周末？',color:pathColors.dau},
    {id:'h13',type:'hypothesis',column:'hypothesis',y:268,h:100,ref:'H1.3',title:'用户试一次就不用了？',color:pathColors.zq},
    {id:'h14',type:'hypothesis',column:'hypothesis',y:388,h:100,ref:'H1.4',title:'Thumbs down 变多？',color:pathColors.sat},
    {id:'a11',type:'finding',column:'action',y:28,h:100,ref:'A1.1',status:'confirmed',title:'Treatment / Control 没有反',color:pathColors.dau},
    {id:'a12',type:'finding',column:'action',y:148,h:100,ref:'A1.2',status:'confirmed',title:'有复活节假期，但影响整个大盘',color:pathColors.dau},
    {id:'a13',type:'finding',column:'action',y:268,h:100,ref:'A1.3',status:'pending',title:'2-day engage ↓',detail:'用户后续参与下降，仍待解释',color:pathColors.zq},
    {id:'a14',type:'finding',column:'action',y:388,h:100,ref:'A1.4',status:'pending',title:'Thumbs down 点击持平\nStop generation rate ↑',detail:'实际发现：Stop generation ↑',color:pathColors.sat}
  ],edges:[['dau','h11','dau'],['dau','h12','dau'],['sat','h14','sat'],['zq','h13','zq'],['h11','a11','dau'],['h12','a12','dau'],['h13','a13','zq'],['h14','a14','sat']]},
  {id:'round-2',title:'第2轮分析',height:430,centerObservations:true,nodes:[
    {id:'o21',type:'metric',column:'observation',y:68,h:114,title:'停止生成',trend:'↑',detail:'用户更常中途停止生成',color:pathColors.sat},
    {id:'o22',type:'metric',column:'observation',y:281,h:114,title:'后续两天使用',trend:'↓',detail:'用户后续两天的使用减少',color:pathColors.zq},
    {id:'h21',type:'hypothesis',column:'hypothesis',y:42,h:166,ref:'H2.1',title:'Stop generation ↑\n由 ZQ 和 Web / Work removal 导致？',detail:'本轮关注的主要变量',color:pathColors.neutral},
    {id:'h22',type:'hypothesis missing',column:'hypothesis',y:280,h:116,ref:'H2.2',status:'pending',title:'2-day engage ↓',detail:'对应假设缺失，原图未给出行动'},
    {id:'f21',type:'finding',column:'action',y:28,h:114,ref:'A2.1',status:'confirmed',title:'Removal 只影响 Premium 用户',detail:'不影响 Starter',color:pathColors.neutral},
    {id:'f22',type:'finding',column:'action',y:162,h:114,ref:'A2.2',status:'confirmed',title:'ZQ 场景：Cancel Rate ↑',detail:'用户进来尝试，然后取消',color:pathColors.neutral},
    {id:'f23',type:'finding',column:'action',y:296,h:114,ref:'A2.3',status:'pending',title:'Non-ZQ 场景仍难解释',detail:'尚未得到解释',color:pathColors.neutral}
  ],edges:[['o21','h21','sat'],['o22','h22','zq'],['h21','f21','neutral'],['h21','f22','neutral'],['h21','f23','neutral']]},
  {id:'round-3',title:'第3轮分析',height:530,alignments:[['h32','a32'],['h33','a31'],['h34','a33']],notes:[{y:48,text:'原图未指定对应实验'}],nodes:[
    {id:'o31',type:'metric',column:'observation',y:28,h:114,title:'中途取消',trend:'↑',detail:'为什么用户更常中途取消？',color:pathColors.experiment},
    {id:'h31',type:'hypothesis',column:'hypothesis',y:28,h:128,ref:'H3.1',title:'Web / Work toggle 缺失\n导致 Cancel Rate ↑？',detail:'原图标注：10%（含义未说明）',color:pathColors.neutral},
    {id:'h32',type:'hypothesis',column:'hypothesis',y:180,h:94,ref:'H3.2',title:'Response is slow',detail:'响应较慢',color:pathColors.experiment},
    {id:'h33',type:'hypothesis',column:'hypothesis',y:294,h:94,ref:'H3.3',title:'Async capability',detail:'异步能力',color:pathColors.zq},
    {id:'h34',type:'hypothesis',column:'hypothesis',y:408,h:94,ref:'H3.4',title:'试一试 ZQ，然后 Stop',color:pathColors.experiment},
    {id:'a32',type:'action',column:'action',y:180,h:94,ref:'A3.1',status:'experiment',title:'Thinking status',detail:'对应 H3.2 · Response is slow',color:pathColors.experiment},
    {id:'a31',type:'action',column:'action',y:294,h:94,ref:'A3.2',status:'experiment',title:'Queued prompt',detail:'对应 H3.3 · Async capability',color:pathColors.zq},
    {id:'a33',type:'action',column:'action',y:408,h:94,ref:'A3.3',status:'experiment',title:'尝试不同 ZQ',detail:'对应 H3.4 · 尝试后停止',color:pathColors.experiment}
  ],edges:[['o31','h31','neutral'],['o31','h32','experiment'],['o31','h33','zq'],['o31','h34','experiment'],['h32','a32','experiment'],['h33','a31','zq'],['h34','a33','experiment']]}
];

// Findings enter the next round's observations before branching to hypotheses.
// Return through the inner whitespace, then enter observation cards from above.
export const pathContinuations: Continuation[] = [
  {from:'a13',to:'o22',lane:.575,returnLane:.25,gapOffset:16},
  {from:'a14',to:'o21',lane:.592,returnLane:.228,gapOffset:32},
  {from:['f21','f22','f23'],to:'o31',lane:.583,returnLane:.18,gapOffset:24}
];
export const continuationSources = (edge: Continuation): string[] => Array.isArray(edge.from) ? edge.from : [edge.from];
export const pathEdges: [string,string][] = [...analysisRounds.flatMap(round=>round.edges.map(([from,to]): [string,string] => [from,to])),...pathContinuations.flatMap(edge=>continuationSources(edge).map((from): [string,string]=>[from,edge.to]))];


export type ExperimentPlan = {
  ref:string; title:string; subtitle:string; hypothesis:string; premise:string; change:string;
  original:string; comparison:string; metrics:string[]; demoNote:string;
  demos:{file:string;label:string;alt:string}[]; actions:{id:string;text:string}[];
};

// Plans and screenshots come from Bebop_5pct_Simplified.pptx, slides 3–4.
// Comparisons, metrics, and implementation checklists below are suggestions.
export const experimentPlans: Record<string, ExperimentPlan> = {
  a32: {
    ref: 'A3.1', title: 'Thinking status', subtitle: '为 Thinking 状态增加动画',
    hypothesis: 'H3.2 · Response is slow',
    premise: '响应较慢可能让用户在等待时停止生成。',
    change: '在 Thinking 状态加入动画，提供持续的等待反馈。',
    original: 'Add animation for Thinking status',
    comparison: '对照组保留现有状态，实验组增加动画；其余响应逻辑保持一致。',
    metrics: ['Stop generation rate', '响应耗时'],
    demos: [{file:'thinking-status.png',label:'Thinking 状态',alt:'PPT 原始 demo：消息下方显示 Thinking 状态，底部显示停止按钮'}],
    demoNote: 'PPT 提供的是静态截图，动画节奏与样式待设计确认。',
    actions: [
      {id:'design',text:'确认 Thinking 动画的样式、开始与结束时机。'},
      {id:'implementation',text:'增加动画实验开关，保留现有状态作为对照。'},
      {id:'measurement',text:'校验状态展示、停止生成和响应耗时的埋点。'},
      {id:'setup',text:'确认负责人、分流比例、实验周期与成功标准后创建实验。'}
    ]
  },
  a31: {
    ref: 'A3.2', title: 'Queued prompt', subtitle: '支持等待时输入下一条 Prompt',
    hypothesis: 'H3.3 · Async capability',
    premise: '异步能力未启用，可能影响用户在等待期间继续表达需求。',
    change: '尝试 Queued prompt，让用户在当前回复生成时准备下一条输入。',
    original: 'Queued- prompt',
    comparison: '对照组保留现有输入行为，实验组启用排队输入；提交、排队及发送时机需确认。',
    metrics: ['Stop generation rate', '后续 Prompt 提交率'],
    demos: [
      {file:'thinking-status.png',label:'01 · 等待回复',alt:'PPT 原始 demo：Thinking 状态下的空输入栏'},
      {file:'queued-prompt.png',label:'02 · 输入下一条',alt:'PPT 原始 demo：Thinking 状态下键盘打开，用户正在输入下一条 Prompt'}
    ],
    demoNote: '截图展示等待与输入状态；完整排队、发送和取消流程待确认。',
    actions: [
      {id:'design',text:'定义排队、发送、编辑与取消的交互规则。'},
      {id:'implementation',text:'实现等待期间的输入能力，并增加实验开关。'},
      {id:'measurement',text:'校验排队、发送、取消及停止生成的埋点。'},
      {id:'setup',text:'确认负责人、分流比例、实验周期与成功标准后创建实验。'}
    ]
  },
  a33: {
    ref: 'A3.3', title: '尝试不同 ZQ', subtitle: '测试不同的 Zero Query 建议',
    hypothesis: 'H3.4 · 试一试 ZQ，然后 Stop',
    premise: 'ZQ 缺少个性化且延迟较高，用户可能试用后就停止生成。',
    change: '尝试不同 ZQ 内容，检验建议内容是否影响尝试后的停止行为。',
    original: 'Experiment with different ZQ',
    comparison: '对照组保留当前 ZQ，实验组使用选定的新内容；布局与响应逻辑保持一致。',
    metrics: ['ZQ 场景 Cancel Rate', 'ZQ engagement'],
    demos: [{file:'different-zq.png',label:'ZQ 入口示例',alt:'PPT 原始 demo：Plan my day、Polish writing、Search in my org、Translate、Market & News 五个 ZQ 入口'}],
    demoNote: 'PPT 展示入口示例，实验候选内容与个性化规则尚未列出。',
    actions: [
      {id:'design',text:'确定对照 ZQ 和实验候选内容，记录每组的内容差异。'},
      {id:'implementation',text:'为候选 ZQ 配置实验开关与分组。'},
      {id:'measurement',text:'校验 ZQ 展示、点击与取消埋点，并观察响应耗时。'},
      {id:'setup',text:'确认负责人、分流比例、实验周期与成功标准后创建实验。'}
    ]
  }
};

