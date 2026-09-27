import type { AnalysisConfig } from './types';

export const analysisModeIds = ['scorecard-review', 'metric-analysis', 'srm-investigation', 'scorecard-qa'] as const;
export type AnalysisMode = typeof analysisModeIds[number];
export const defaultAnalysisMode: AnalysisMode = 'scorecard-review';

export const analysisModes: { id: AnalysisMode; label: string }[] = [
  { id: 'scorecard-review', label: 'Scorecard Review' },
  { id: 'metric-analysis', label: 'Metric Analysis' },
  { id: 'srm-investigation', label: 'SRM Investigation' },
  { id: 'scorecard-qa', label: 'Scorecard Q&A' },
];

export function isAnalysisMode(value: unknown): value is AnalysisMode {
  return analysisModeIds.some(id => id === value);
}

// Older locally saved configurations predate the composer mode selector.
export function normalizeAnalysisConfig(config: AnalysisConfig): AnalysisConfig {
  return { ...config, analysisMode: isAnalysisMode(config.analysisMode) ? config.analysisMode : defaultAnalysisMode };
}
