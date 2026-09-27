export type DemoVariant = 'control' | 'treatment';
export type ExperimentDemo = {
  title: string;
  src: string;
  variants: Record<DemoVariant, { label: string; description: string }>;
};

// Only attach a demo when a matching frontend experience is available.
// Control shows the supplied Figma design; Treatment keeps the original iOS demo.
const demos: Record<string, ExperimentDemo> = {
  'bebop-5pct': {
    title: 'Copilot · iOS',
    src: '/demos/copilot-ios/index.html',
    variants: {
      control: { label: 'Control', description: 'Static preview of the supplied Figma design' },
      treatment: { label: 'Treatment', description: 'Original default iOS prototype' },
    },
  },
};

export function getExperimentDemo(experimentId: string) {
  return demos[experimentId];
}
