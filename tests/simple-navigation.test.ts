import test from 'node:test';
import assert from 'node:assert/strict';
import { initialWorkspace } from '../lib/metis/data';
import { datasets, seedWorkspace, sessionIdForExperiment } from '../lib/metis/datasets';
import { resolveSimpleView } from '../lib/metis/simple-navigation';

test('fresh visits open the library while retaining saved analysis work', () => {
  const saved = seedWorkspace(initialWorkspace());
  saved.view = 'workspace';
  saved.selectedBranchId = sessionIdForExperiment('bebop-5pct');
  const result = resolveSimpleView(saved);
  assert.equal(result.view, 'library');
  assert.equal(result.branches, saved.branches);
  assert.equal(result.selectedBranchId, saved.selectedBranchId);
});

test('every connected experiment opens its existing report without creating runs or copies', () => {
  let state = seedWorkspace(initialWorkspace());
  const before = structuredClone(state.branches);
  for (const data of datasets) {
    state = resolveSimpleView(state, data.experiment.id);
    assert.equal(state.view, 'workspace');
    const branch = state.branches.find(item => item.id === state.selectedBranchId)!;
    assert.equal(branch.experimentId, data.experiment.id);
    assert.ok(branch.artifacts.some(item => item.kind === 'report'));
    state = resolveSimpleView(resolveSimpleView(state), data.experiment.id);
    assert.deepEqual(state.branches, before);
  }
});

test('refreshing a deep link preserves the selected analysis branch and its work', () => {
  const state = seedWorkspace(initialWorkspace());
  const source = state.branches.find(item => item.experimentId === 'bebop-5pct')!;
  state.branches.push({ ...structuredClone(source), id: 'saved-follow-up', parentId: source.id, name: 'Follow-up' });
  state.selectedBranchId = 'saved-follow-up';
  const restored = resolveSimpleView(JSON.parse(JSON.stringify(state)), 'bebop-5pct');
  assert.equal(restored.selectedBranchId, 'saved-follow-up');
  assert.deepEqual(restored.branches, state.branches);
});

test('unconnected or invalid experiment links fall back to the library', () => {
  const state = seedWorkspace(initialWorkspace());
  for (const id of ['search-relevance', 'email-reactivation', 'missing', 'constructor']) {
    assert.equal(resolveSimpleView(state, id).view, 'library');
  }
});
