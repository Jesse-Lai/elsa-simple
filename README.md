# ELSA — Simplified experiment workspace

Independent copy of the current ELSA product. The original application is untouched.

- Opens directly in Experiment library, without a sidebar or setup screen.
- Click an available experiment row to open its existing analysis.
- Return using the top navigation or browser Back. Search and filters stay in place.
- Reuses the existing shadcn/ui, prompt-kit, reports, evidence, charts and analysis interactions.
- Uses separate browser storage: `elsa-simple-workspace-v1`.
- Unconnected experiments remain unavailable; the original sample/source data is preserved.

## Run

```sh
npm install
npm run dev -- --port 5180
```

Open http://localhost:5180. Direct links use `/?experiment=bebop-5pct` (the previous `/cases/bebop-5pct` route also works).

## Verify

```sh
npm run typecheck
npm test
npm run build
```

Live AI remains optional and requires server-side `OPENAI_API_KEY`. Prepared reports work without it. This copy has its own Sites identity and does not deploy over the original.
