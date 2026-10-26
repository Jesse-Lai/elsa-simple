'use client';

import { useEffect, useRef, useState } from 'react';
import dimensions from '@/public/design/2026-10-20/manifest.json';

// Keep each exported SVG at its intrinsic size; its viewport owns responsive scaling.
export function DesignVector({ file, fit = false }: { file: keyof typeof dimensions; fit?: boolean }) {
  const box = useRef<HTMLSpanElement>(null);
  const natural = dimensions[file];
  const [scale, setScale] = useState({ x: 1, y: 1 });
  useEffect(() => {
    if (!fit || !box.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale({ x: entry.contentRect.width / natural.width, y: entry.contentRect.height / natural.height });
    });
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [fit, natural.width, natural.height]);
  return <span ref={box} aria-hidden="true" style={{ display: 'block', position: 'relative', flexShrink: 0, width: fit ? '100%' : natural.width, height: fit ? '100%' : natural.height }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img alt="" src={`/design/2026-10-20/${file}.svg`} width={natural.width} height={natural.height} style={{ display: 'block', maxWidth: 'none', width: natural.width, height: natural.height, position: fit ? 'absolute' : undefined, transformOrigin: 'top left', transform: fit ? `scale(${scale.x}, ${scale.y})` : undefined }}/>
  </span>;
}
