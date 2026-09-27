import type { AnalysisMode } from './analysis-modes';
import type { CaseStudy } from './case-study-types';
import type { UserPathNode } from './user-analysis-path';
import type { PathRevision } from './path-reasoning';

export type MetricRole = 'target' | 'guardrail' | 'fundamental' | 'excluded';
export type MetricId = 'activation' | 'latency' | 'crashes' | 'retention' | 'sessions';
export type EvidenceRef = { id: string; title: string; metricId: MetricId; kind: 'metric' | 'trend' | 'segment' | 'source'; sourceIds?: string[] };
export type Metric = {
  id: MetricId; name: string; description: string; unit: '%' | 'ms' | '/user';
  control: number; treatment: number; ci: [number, number] | null; direction: 'up' | 'down';
  role: MetricRole; threshold: number | null; unexpected?: boolean; sourceIds?: string[]; window?: string;
};
export type Experiment = { id: string; group: string; name: string; url: string; snapshotId: string; start: string; end: string; controlN: number; treatmentN: number; objective: string };
export type AnalysisConfig = { analysisMode: AnalysisMode; objective: string; requirements: string; roles: Record<MetricId, MetricRole>; thresholds: Record<MetricId, number> };
export type Finding = { title: string; body: string; evidenceIds: string[]; tone: 'positive' | 'caution' | 'neutral'; hypothesis: string; validation: string };
export type Report = { shortTitle?: string; headline: string; summary: string; recommendation: 'iterate' | 'ship' | 'continue' | 'stop'; findings: Finding[]; limitations: string[] };
export type Artifact = { id: string; title: string; kind: 'report' | 'trend' | 'segments' | 'comparison'; metricId: MetricId; evidenceIds: string[]; report?: Report; origin: 'demo' | 'ai' | 'user' | 'source'; runId?: string; config?: AnalysisConfig };
export type ActionItem = { id: string; sourceKey: string; title: string; hypothesis: string; validation: string; evidenceIds: string[]; priority: 'High' | 'Medium' | 'Low'; owner: string; successSignal: string; completed: boolean };
export type AgentSuggestion = { kind: 'branch' | 'action'; title: string; prompt: string; evidenceIds: string[] };
export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; evidenceIds: string[]; origin: 'demo' | 'ai' | 'user' | 'source'; status?: 'complete' | 'incomplete'; suggestions?: AgentSuggestion[]; tools?: string[]; pathNodeId?: string; pathRevisionId?: string };
export type AnalysisRun = { id: string; mode: 'analyze' | 'chat'; startedAt: string; status: 'running' | 'complete' | 'error' | 'cancelled'; error?: string; artifactIds: string[]; config: AnalysisConfig };
export type AnalysisBranch = { id: string; experimentId: string; parentId: string | null; groupName?: string; name: string; snapshotId: string; context: string; evidenceIds: string[]; config: AnalysisConfig; artifacts: Artifact[]; messages: ChatMessage[]; actions: ActionItem[]; runs: AnalysisRun[]; pathFocusId?: string; pathRevisions?: PathRevision[]; pathCustomNodes?: UserPathNode[] };
export type Workspace = { version: 1; branches: AnalysisBranch[]; selectedBranchId: string; view: 'home' | 'library' | 'workspace'; followedExperimentIds?: string[] };
export type ExperimentDataset = {
  caseStudy?: CaseStudy;
  experiment: Experiment;
  metrics: Metric[];
  metricById: Record<MetricId, Metric>;
  defaultConfig: AnalysisConfig;
  trends: Partial<Record<MetricId, { date: string; control: number; treatment: number }[]>>;
  segments: readonly { id: string; name: string; n: number; activation: readonly number[]; latency: readonly number[]; note: string; tone: string }[];
  evidence: EvidenceRef[];
  evidenceById: Record<string, EvidenceRef>;
  demoReport: Report;
};
export type AgentEvent =
  | { type: 'stage'; label: string }
  | { type: 'delta'; text: string }
  | { type: 'tool'; label: string }
  | { type: 'artifact'; artifact: Artifact }
  | { type: 'suggestions'; suggestions: AgentSuggestion[] }
  | { type: 'path-revision'; revision: PathRevision }
  | { type: 'done'; evidenceIds: string[] }
  | { type: 'error'; message: string };
