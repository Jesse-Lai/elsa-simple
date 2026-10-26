/* Figma Data Agent, 151:483 and 189:5233. Keep the exported SVGs at their
 * intrinsic dimensions; chart wrappers, rather than the images, own layout. */
export const designAssets = '/design/2026-10-12';

export function DesignIcon({ file, className = '' }: { file: string; className?: string }) {
  // These are local Figma vectors, not responsive content images.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`${designAssets}/${file}.svg`} alt="" className={`shrink-0 max-w-none ${className}`} />;
}
