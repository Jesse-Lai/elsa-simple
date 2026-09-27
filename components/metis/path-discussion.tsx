'use client';

import { createContext, useContext } from 'react';
import type { UserPathNode } from '@/lib/metis/user-analysis-path';
import type { PathRevision } from '@/lib/metis/path-reasoning';

export type PathDiscussion = {
  customNodes: UserPathNode[];
  saveNode: (node: UserPathNode) => boolean;
  removeNode: (id: string) => void;
  revisions: PathRevision[];
  busyNodeId?: string;
  busy: boolean;
  focusId?: string;
  focus: (id?: string) => void;
  submit: (nodeId: string, comment: string) => boolean;
};
const Context = createContext<PathDiscussion | null>(null);
export const PathDiscussionProvider = Context.Provider;
export const usePathDiscussion = () => useContext(Context);
