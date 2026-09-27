'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function ReportViewport({ children, composer, scrollKey }: {
  children: ReactNode;
  composer: ReactNode;
  scrollKey: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const hasComposer = Boolean(composer);

  useEffect(() => {
    const viewport = viewportRef.current;
    const dock = dockRef.current;
    if (!viewport || !dock) return;

    // Keep the last report controls reachable as the input grows or gains context.
    const updateSpace = () => viewport.style.setProperty('--composer-space', `${dock.offsetHeight + 16}px`);
    updateSpace();
    const observer = new ResizeObserver(updateSpace);
    observer.observe(dock);
    return () => observer.disconnect();
  }, [hasComposer]);

  return <div ref={viewportRef} className="relative h-full min-h-0 min-w-0">
    <div
      key={scrollKey}
      className="h-full min-w-0 overflow-y-auto"
      style={hasComposer ? { paddingBottom: 'var(--composer-space, 160px)', scrollPaddingBottom: 'var(--composer-space, 160px)' } : undefined}
    >{children}</div>
    {hasComposer && <div ref={dockRef} className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8 md:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto w-full max-w-3xl rounded-3xl bg-background shadow-lg">
        {composer}
      </div>
    </div>}
  </div>;
}
