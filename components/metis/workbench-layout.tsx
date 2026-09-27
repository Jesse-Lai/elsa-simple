'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function WorkbenchLayout({ children, onContentResize }: { children: ReactNode; onContentResize: (width: number) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const resize = useRef(onContentResize);
  resize.current = onContentResize;
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => resize.current(entry.contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} className="flex min-h-0 min-w-0 flex-1">{children}</div>;
}
