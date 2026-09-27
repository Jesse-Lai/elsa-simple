export type CaseSource = { id: string; title: string; file: string; detail: string };
export type CaseMetric = {
  id: string; name: string; control: number; treatment: number; unit: '%' | '/user' | 's' | 'ratio';
  window: string; sourceIds: string[]; reportedRelative?: number; pValue?: string;
  note: string; group: 'entry' | 'engagement' | 'quality' | 'early' | 'cancel';
};
export type CaseStep = { id: string; date: string; question: string; action: string; result: string; status: string; sourceIds: string[] };
export type CaseHypothesis = { id: string; title: string; status: string; support: string; counter: string; validation: string; sourceIds: string[] };
export type CasePlan = { id: string; title: string; hypothesis: string; validation: string; sourceIds: string[]; origin: 'Original proposal' | 'ELSA validation plan' };
export type CaseStudy = {
  id: string; title: string; objective: string; headline: string; summary: string;
  treatmentId: string; controlId: string; sampleNote: string; sourceLabel: string;
  sources: CaseSource[]; metrics: CaseMetric[]; steps: CaseStep[]; hypotheses: CaseHypothesis[]; plans: CasePlan[];
  limitations: string[];
};
