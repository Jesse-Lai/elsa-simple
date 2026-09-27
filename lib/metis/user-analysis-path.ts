import { z } from 'zod';
import { analysisRounds, pathColors, pathEdges, type AnalysisRound, type PathNode, type PathColor } from './bebop-analysis-path';

export const maxUserPathNodes = 60;
export const userPathNodeSchema = z.object({
  id: z.string().regex(/^custom-[a-zA-Z0-9-]+$/).max(80),
  roundId: z.enum(['round-1', 'round-2', 'round-3']),
  kind: z.enum(['observation', 'hypothesis']),
  title: z.string().trim().min(1).max(180),
  detail: z.string().trim().max(600).default(''),
  parentId: z.string().max(80).optional(),
});
export type UserPathNode = z.infer<typeof userPathNodeSchema>;
export const userPathNodesSchema = z.array(userPathNodeSchema).max(maxUserPathNodes).superRefine((nodes, ctx) => {
  const ids = new Set<string>();
  nodes.forEach((node, index) => {
    if (ids.has(node.id)) ctx.addIssue({ code: 'custom', path: [index, 'id'], message: 'Duplicate node ID.' });
    ids.add(node.id);
    if (!node.parentId) return;
    const original = analysisRounds.find(round => round.id === node.roundId)?.nodes.find(parent => parent.id === node.parentId && parent.column === 'observation');
    const custom = nodes.find(parent => parent.id === node.parentId && parent.roundId === node.roundId && parent.kind === 'observation');
    if (node.kind !== 'hypothesis' || (!original && !custom)) ctx.addIssue({ code: 'custom', path: [index, 'parentId'], message: 'A hypothesis can only link to an observation in the same round.' });
  });
});

export function userPathGraph(customNodes: UserPathNode[] = []) {
  const rounds: AnalysisRound[] = analysisRounds.map(round => {
    const additions = customNodes.filter(node => node.roundId === round.id);
    const baseline = Math.max(...round.nodes.map(node => node.y + node.h)) + 28;
    const indexes = { observation: 0, hypothesis: 0 };
    const nodes: PathNode[] = additions.map(node => {
      const parent = round.nodes.find(parent => parent.id === node.parentId);
      return {
        id: node.id, type: node.kind === 'observation' ? 'metric' : 'hypothesis', column: node.kind,
        y: baseline + indexes[node.kind]++ * 132, h: 104, title: node.title, detail: node.detail,
        ref: node.kind === 'observation' ? '用户观察' : '用户假设',
        color: parent?.color ?? pathColors.neutral,
      };
    });
    const edges: AnalysisRound['edges'] = additions.filter(node => node.parentId).map(node => {
      const color = round.nodes.find(parent => parent.id === node.parentId)?.color;
      return [node.parentId!, node.id, (Object.entries(pathColors).find(([, value]) => value === color)?.[0] ?? 'neutral') as PathColor];
    });
    return { ...round, nodes: [...round.nodes, ...nodes], edges: [...round.edges, ...edges] };
  });
  const nodes = rounds.flatMap(round => round.nodes);
  const edges: [string, string][] = [...pathEdges, ...customNodes.filter(node => node.parentId).map(node => [node.parentId!, node.id] as [string, string])];
  return { rounds, nodes, edges, nodeById: Object.fromEntries(nodes.map(node => [node.id, node])) };
}

export function removeUserPathNode(nodes: UserPathNode[], id: string): UserPathNode[] {
  return nodes.filter(node => node.id !== id).map(node => node.parentId === id ? { ...node, parentId: undefined } : node);
}
