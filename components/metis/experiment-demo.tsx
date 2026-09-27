'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DemoVariant, ExperimentDemo } from '@/lib/metis/experiment-demos';
import styles from './experiment-demo.module.css';

export function ExperimentDemoPanel({ demo }: { demo: ExperimentDemo }) {
  const stage = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 640, height: 1000, scale: 1 });
  const [variant, setVariant] = useState<DemoVariant>('control');
  const [visited, setVisited] = useState<DemoVariant[]>(['control']);
  const [revisions, setRevisions] = useState({ control: 0, treatment: 0 });
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      // Keep the original desktop preview viewport (including its status bar),
      // then scale the complete embed instead of overriding product styles.
      const virtualWidth = Math.max(640, width);
      const scale = width / virtualWidth;
      setViewport({ width: virtualWidth, height: height / scale, scale });
    });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  return <aside className={styles.panel} aria-label="Experiment demo">
    <Tabs value={variant} onValueChange={value => {
      const next = value as DemoVariant;
      setVariant(next);
      setVisited(previous => previous.includes(next) ? previous : [...previous, next]);
    }} className={styles.tabs}>
      <div className="flex shrink-0 items-center gap-2 px-3 pt-3">
      <TabsList className="grid flex-1 grid-cols-2" aria-label="Experiment variant">
        <TabsTrigger value="control">Control</TabsTrigger>
        <TabsTrigger value="treatment">Treatment</TabsTrigger>
      </TabsList>
      <Button variant="ghost" size="icon-sm" aria-label="Restart demo" title="Restart demo" onClick={() => setRevisions(s => ({ ...s, [variant]: s[variant] + 1 }))}><RotateCcw/></Button>
      </div>
      <div ref={stage} className={styles.stage}>
        {visited.map(value => {
          const revision = `${value}-${revisions[value]}`;
          return <TabsContent key={value} value={value} forceMount hidden={variant !== value} className={styles.preview}>
            <iframe key={revision} src={`${demo.src}?variant=${value}`} title={`${demo.title} — ${demo.variants[value].label}`}
              style={{ width: viewport.width, height: viewport.height, transform: `scale(${viewport.scale})`, transformOrigin: 'top left' }}
              sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer"/>
          </TabsContent>;
        })}
      </div>
    </Tabs>
  </aside>;
}
