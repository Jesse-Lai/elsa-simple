# ELSA — Simplified experiment workspace

Independent copy of the current ELSA product. The original application is untouched.

- Opens directly in Experiment library, without a sidebar or setup screen.
- Click an available experiment row to open its existing analysis.
- Return using the top navigation or browser Back. Search and filters stay in place.
- Reuses the existing shadcn/ui, prompt-kit, reports, evidence, charts and analysis interactions.
- Uses separate browser storage: `elsa-simple-workspace-v1`.
- Unconnected experiments remain unavailable; the original sample/source data is preserved.

## Run

Requires Node.js 22.13 or newer. The homepage assistant and report examples work with mock data without an API key.

```sh
npm ci
npm run dev -- --port 5180
```

Open http://localhost:5180. Direct links use `/?experiment=bebop-5pct` (the previous `/cases/bebop-5pct` route also works).

Next.js and `eslint-config-next` are pinned to `16.4.0`, the Microsoft Client
Patching requirement for Next.js 16.x reported on October 15, 2026. Run
`npm install` after pulling dependency updates so the installed copies match
the lockfile. Use explicit stable versions for future upgrades: the configured
package feed's `latest` tag may point to a canary release.

## Verify

```sh
npm run typecheck
npm test
npm run build
```

Live AI remains optional and requires server-side `OPENAI_API_KEY`. Prepared reports work without it. This copy has its own Sites identity and does not deploy over the original.

## October 12 Figma update

The library and Bebop analysis now follow the supplied Figma frames `151:483` and `189:5233`, including their literal sample readouts, repeated elements, and faded sections. Design assets are local under `public/design/2026-10-12/`; connected Fluent icons use `@fluentui/react-icons`. The existing analytical snapshots remain separate from these presentation fixtures. Other experiment reports retain their existing presentation.

## Current product

- Experiment library with search, status and data-type filters.
- Persistent homepage Experiment assistant with prepared summaries and mock replies.
- Bebop analysis with metric breakdowns, editable analysis paths, and Control/Treatment previews.
- Report detail pages at `/?report=bebop-engagement-report` and `/?report=bebop-revenue-report`.
- Profile settings and skill reference pages.

Sample report data and mock assistant responses are demonstration content. Local environment files, build outputs, and tool state are excluded from Git.
