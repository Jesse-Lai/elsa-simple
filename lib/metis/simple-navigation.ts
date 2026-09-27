import { sessionIdForExperiment } from './datasets';
import type { Workspace } from './types';

// Entry always starts in the library unless the URL names an available experiment.
// Reuse the saved analysis; opening an experiment must never create a new run.
export function resolveSimpleView(workspace: Workspace, experimentId?: string | null): Workspace {
  const selected = workspace.branches.find(branch => branch.id === workspace.selectedBranchId);
  const target = experimentId && workspace.branches.find(branch => branch.id === sessionIdForExperiment(experimentId));
  if (!target) return { ...workspace, view: 'library' };
  return { ...workspace, view: 'workspace', selectedBranchId: selected?.experimentId === experimentId ? selected.id : target.id };
}
