import test from 'node:test';
import assert from 'node:assert/strict';
import { analysisRounds } from '../lib/metis/bebop-analysis-path';
import { analysisPathLayout, relatedPathNodes } from '../lib/metis/analysis-path-layout';
import { currentPathUpdates, downstreamPathNodes, pathReasoningInstructions, pathRequestSchema, validatePathResult, type PathUpdate } from '../lib/metis/path-reasoning';
import { removeUserPathNode, userPathGraph, userPathNodesSchema, type UserPathNode } from '../lib/metis/user-analysis-path';

const observation: UserPathNode = { id: 'custom-observation', roundId: 'round-1', kind: 'observation', title: 'Response latency rises in longer conversations', detail: 'A user observation to verify.' };
const hypothesis: UserPathNode = { id: 'custom-hypothesis', roundId: 'round-1', kind: 'hypothesis', title: 'Longer waits may explain cancellation', detail: '', parentId: observation.id };
const update = (nodeId: string): PathUpdate => ({ nodeId, conclusion: 'Needs validation', reasoning: 'This is user-supplied context.', state: 'needs-data', evidenceIds: [] });

test('user additions survive serialization without changing original evidence or allowing invalid links', () => {
  const originals = JSON.stringify(analysisRounds);
  const restored = userPathNodesSchema.parse(JSON.parse(JSON.stringify([observation, hypothesis])));
  assert.equal(userPathGraph(restored).nodeById[hypothesis.id].title, hypothesis.title);
  assert.equal(JSON.stringify(analysisRounds), originals);
  for (const invalid of [
    [observation, { ...hypothesis, parentId: 'h11' }],
    [observation, { ...hypothesis, roundId: 'round-2' }],
    [{ ...observation, parentId: hypothesis.id }, hypothesis],
    [observation, { ...hypothesis, id: observation.id }],
    [{ ...observation, id: 'dau' }],
    [{ ...observation, title: '   ' }],
  ]) assert.equal(userPathNodesSchema.safeParse(invalid).success, false);
});

test('added nodes reflow with long content and keep footer controls and cross-round routes clear', () => {
  const custom: UserPathNode[] = analysisRounds.flatMap(round => Array.from({ length: 3 }, (_, i) => [
    { ...observation, id: `custom-${round.id}-o${i}`, roundId: round.id as UserPathNode['roundId'] },
    { ...hypothesis, id: `custom-${round.id}-h${i}`, roundId: round.id as UserPathNode['roundId'], parentId: `custom-${round.id}-o${i}` },
  ]).flat());
  const graph = userPathGraph(custom);
  const heights = Object.fromEntries(graph.nodes.map((node, i) => [node.id, i % 2 ? 280 : 90]));
  for (const width of [640, 850, 1200]) {
    const layout = analysisPathLayout(width, heights, graph.rounds, 72);
    for (const round of graph.rounds) {
      const position = layout.rounds[round.id];
      for (const column of ['observation', 'hypothesis', 'action']) {
        const boxes = round.nodes.filter(node => node.column === column).map(node => layout.boxes[node.id]).sort((a, b) => a.y - b.y);
        boxes.forEach((box, i) => {
          assert.ok(box.y + box.height < position.diagramTop + position.diagramHeight - 60);
          if (i) assert.ok(box.y >= boxes[i - 1].y + boxes[i - 1].height + 20);
        });
      }
      for (const [left, right] of round.alignments ?? []) assert.equal(layout.boxes[left].y, layout.boxes[right].y);
    }
    for (const route of layout.routes) assert.doesNotMatch(route.d, /NaN|Infinity/);
    for (const node of custom.filter(node => node.parentId)) assert.ok(layout.routes.some(route => route.to === node.id && route.from.includes(node.parentId!)));
  }
});

test('comments on user nodes propagate only to linked descendants, including from existing observations', () => {
  const nodes = [observation, hypothesis, { ...hypothesis, id: 'custom-dau-hypothesis', parentId: 'dau' }];
  assert.deepEqual(downstreamPathNodes(observation.id, nodes), [observation.id, hypothesis.id]);
  assert.ok(downstreamPathNodes('dau', nodes).includes('custom-dau-hypothesis'));
  const graph = userPathGraph(nodes);
  assert.deepEqual([...relatedPathNodes(hypothesis.id, graph.edges)].sort(), [hypothesis.id, observation.id].sort());
  const request = pathRequestSchema.parse({ nodeId: observation.id, customNodes: nodes, current: [] });
  assert.match(pathReasoningInstructions(request), /unverified user observations and hypotheses/);
  const result = { summary: 'Review user context', updates: [update(observation.id), update(hypothesis.id)] };
  assert.doesNotThrow(() => validatePathResult(observation.id, result, [], nodes));
  assert.throws(() => validatePathResult(observation.id, { ...result, updates: [update(observation.id)] }, [], nodes));
  assert.throws(() => validatePathResult(observation.id, { ...result, updates: [...result.updates, update('dau')] }, [], nodes));
  assert.equal(currentPathUpdates([{ ...result, id: 'revision', nodeId: observation.id, comment: 'Please verify', createdAt: '2026-09-23' }], nodes)[hypothesis.id].state, 'needs-data');
  assert.doesNotThrow(() => pathRequestSchema.parse({ nodeId: 'dau', current: [] }));
});

test('removing an observation keeps its hypotheses as independent nodes', () => {
  const remaining = removeUserPathNode([observation, hypothesis], observation.id);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].parentId, undefined);
  assert.doesNotThrow(() => userPathNodesSchema.parse(remaining));
  assert.deepEqual(downstreamPathNodes(hypothesis.id, remaining), [hypothesis.id]);
});
