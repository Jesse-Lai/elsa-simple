'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { MessageSquare, Smartphone } from 'lucide-react';
import { usePanelRef } from 'react-resizable-panels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import styles from './workspace-panel.module.css';

export type WorkspacePanelTab = 'conversation' | 'prototype';

export function WorkspacePanel({ open, activeTab, narrow, onOpenChange, onTabChange, children, conversation, prototype }: {
  open: boolean;
  activeTab: WorkspacePanelTab;
  narrow: boolean;
  onOpenChange: (open: boolean) => void;
  onTabChange: (tab: WorkspacePanelTab) => void;
  children: ReactNode;
  conversation: ReactNode;
  prototype?: ReactNode;
}) {
  const groupElement = useRef<HTMLDivElement>(null);
  const sidePanel = usePanelRef();
  const expandedSize = useRef(36);
  const initialLayout = useRef({ 'experiment-report': open ? 64 : 100, 'workspace-panel': open ? 36 : 0 });

  useEffect(() => {
    const group = groupElement.current;
    const panel = sidePanel.current;
    if (narrow || !group || !panel) return;
    // Only animate visibility changes; dragging the divider stays immediate.
    group.dataset.animating = 'true';
    let frame = 0;
    // Parent panels can initially measure zero during hydration. Wait for a real
    // width before applying pixel constraints, or the open panel gets collapsed.
    const observer = new ResizeObserver(([entry]) => {
      if (!entry.contentRect.width) return;
      observer.disconnect();
      frame = requestAnimationFrame(() => panel.resize(open ? `${expandedSize.current}%` : '0%'));
    });
    observer.observe(group);
    const timer = window.setTimeout(() => delete group.dataset.animating, 320);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.clearTimeout(timer);
      delete group.dataset.animating;
    };
  }, [open, narrow, sidePanel]);

  function stopTransition() {
    if (groupElement.current) delete groupElement.current.dataset.animating;
  }
  function collapse() {
    onOpenChange(false);
    requestAnimationFrame(() => document.getElementById('toggle-workspace-panel')?.focus());
  }

  return <div className={styles.layout} data-open={open} data-narrow={narrow}>
    <ResizablePanelGroup id="workspace-panel-layout" elementRef={groupElement} orientation="horizontal" defaultLayout={initialLayout.current} disabled={narrow}
      className={styles.split}
      onLayoutChanged={(layout, { isUserInteraction }) => {
        if (!isUserInteraction || narrow) return;
        const size = layout['workspace-panel'];
        if (size > 0) expandedSize.current = size;
        else if (open) collapse();
      }}>
      <ResizablePanel id="experiment-report" minSize="40%"
        className={styles.report} style={{ overflow: 'hidden' }} aria-hidden={narrow && open || undefined} inert={narrow && open || undefined}>
        {children}
      </ResizablePanel>
      {/* Re-register the divider so the library rebuilds its mapping when enabled. */}
      <ResizableHandle key={open && !narrow ? 'open' : 'closed'} aria-label="Resize workspace panel"
        disabled={!open || narrow} aria-hidden={!open || narrow || undefined}
        onPointerDownCapture={stopTransition} onKeyDownCapture={stopTransition}
        className={open && !narrow ? 'shrink-0' : 'pointer-events-none w-0 opacity-0'}/>
      <ResizablePanel id="workspace-panel" panelRef={sidePanel}
        collapsible minSize="320px" maxSize="48%" className={styles.panel}
        style={{ overflow: 'hidden' }} aria-hidden={!open || undefined} inert={!open || undefined}>
        <div id="experiment-workspace-panel" className={styles.surface}>
          <Tabs value={activeTab} onValueChange={value => onTabChange(value as WorkspacePanelTab)} className="h-full min-h-0 gap-0">
            <div className="flex h-12 shrink-0 items-center justify-between gap-1 border-b px-3">
              <TabsList variant="line" aria-label="Workspace panel" className="h-full min-w-0 gap-1 p-0">
                <TabsTrigger value="conversation" className="h-full px-2 after:bottom-0"><MessageSquare/>Conversation</TabsTrigger>
                {prototype && <TabsTrigger value="prototype" className="h-full px-2 after:bottom-0"><Smartphone/>Variants</TabsTrigger>}
              </TabsList>
            </div>
            <TabsContent value="conversation" forceMount hidden={activeTab !== 'conversation'} className={styles.tabContent}>
              {conversation}
            </TabsContent>
            {prototype && <TabsContent value="prototype" forceMount hidden={activeTab !== 'prototype'} className={styles.tabContent}>
              {prototype}
            </TabsContent>}
          </Tabs>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>;
}
