# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Inbox Triage: paste a batch of inbound messages (emails, Slack, tickets), Gemini classifies each by
category/urgency, extracts action items, and drafts replies for the ones that matter. No auth, no
database — results live in memory + `localStorage` for the current batch.

## Commands

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill in GEMINI_API_KEY
npx wrangler types                # regenerate Env types after touching wrangler.jsonc

npm run dev                       # Vite (:5173) + `wrangler pages dev` (:8788, proxying to Vite)
npm run typecheck                 # tsc -b across all 4 project references (see below)
npm run lint                      # oxlint
npm run test                      # vitest run (all tests)
npm run test:watch                # vitest watch mode
npm run build                     # tsc -b && vite build -> dist/
npm run deploy                    # build + wrangler pages deploy ./dist
```

Run a single test file: `npx vitest run src/lib/parseInput.test.ts`. Run tests matching a name: `npx vitest run -t "parsePlainText"`.

Local dev serves everything through **`http://localhost:8788`** (the Wrangler-proxied port) — `/api/*`
Pages Functions only work there, not on the bare Vite port `:5173`.

## Architecture

**Frontend** (`src/`): Vite + React 19 + TypeScript + Tailwind v4 (via `@tailwindcss/vite`, no
`tailwind.config.js`). `App.tsx` is a hand-rolled view-state machine (`"input" | "results" | "detail"`,
no router) that owns `items`/`results` state, calls the backend via `src/lib/api.ts`, and persists the
last triage batch to `localStorage` via `src/lib/storage.ts` so a refresh doesn't lose data.
`src/lib/parseInput.ts` parses the textarea input either as a pasted JSON array or as blank-line-separated
plain-text blocks with optional `From:`/`Subject:` header lines (stateful line parser — see its doc
comment; this format is intentionally more complex than a naive blank-line split because a single blank
line separates the header from the body *within* one item, not just between items).

**Backend** (`functions/`): Cloudflare Pages Functions, file-based routing (`functions/api/triage.ts` →
`/api/triage`, `functions/api/draft-reply.ts` → `/api/draft-reply`). `public/_routes.json` restricts
Functions invocation to `/api/*`; everything else is served as static assets from `dist/`.
`functions/_lib/gemini.ts` calls the Gemini `generateContent` API **directly via `fetch`** (no
`@anthropic-ai/sdk`/Google SDK dependency, no `nodejs_compat` compatibility flag needed) — auth via
`x-goog-api-key` header, `GEMINI_API_KEY` env var. Structured output (triage results) uses Gemini's
`responseMimeType: "application/json"` + `responseSchema` (uppercase type enums: `OBJECT`, `ARRAY`,
`STRING`, `INTEGER` — this is Gemini's own Schema format, not JSON Schema). Plain-text output (draft
replies) omits the schema. `functions/_lib/validation.ts` holds the Zod request schemas shared by both
route handlers.

**Env/types**: `GEMINI_API_KEY` is the only env var (Cloudflare secret in prod, `.dev.vars` locally —
gitignored). `worker-configuration.d.ts` (the generated `Env` interface) is **committed**, not
gitignored, specifically so `npm run typecheck`/CI work on a bare checkout without a local `.dev.vars`
(Wrangler infers `Env` var names from `.dev.vars` when generating types, so a missing `.dev.vars` would
otherwise yield an empty `Env` and break every `ctx.env.GEMINI_API_KEY` reference). Regenerate it with
`npx wrangler types` after changing `wrangler.jsonc` or the env var set.

**TypeScript project layout**: `tsconfig.json` references three independent projects —
`tsconfig.app.json` (`src/`, DOM lib), `tsconfig.node.json` (`vite.config.ts`, Node lib), and
`tsconfig.functions.json` (`functions/` + `worker-configuration.d.ts`, `@cloudflare/workers-types`,
Workers runtime — no DOM lib). Cross-project imports (e.g. `functions/api/triage.ts` importing
`TriageResult` from `../../src/types`) work via plain relative paths; Wrangler's esbuild-based bundler
resolves them at deploy time same as `tsc -b` does at typecheck time.

**Testing** (Vitest, `vitest.config.ts`, `globals: false` — import `describe`/`it`/`expect`/`vi` from
`"vitest"` explicitly): default environment is `happy-dom` (needed for the React component tests and
`localStorage`). `functions/api/triage.test.ts` and `draft-reply.test.ts` override this per-file with a
leading `// @vitest-environment node` pragma because the handlers call the static `Response.json(...)`
helper directly and Node's real `Response` is the reliable choice there; they call `onRequestPost`
directly with a hand-built context object and mock `global.fetch` to fake Gemini's response shape rather
than mocking `functions/_lib/gemini.ts`, so the full validation → Gemini-call → response-shaping path is
exercised. `userEvent.setup()` (from `@testing-library/user-event`) installs its own clipboard stub, so
any test that needs to spy on `navigator.clipboard.writeText` (see `DetailView.test.tsx`) must set that
mock up **after** calling `setup()`, not before.

**CI** (`.github/workflows/ci.yml`): push/PR to `main` run lint → typecheck → test → build on
`ubuntu-latest`, Node 24. No secrets are configured or needed — every test mocks `fetch`, so nothing in
the suite makes a real network call.

## Deploying

```bash
npx wrangler pages secret put GEMINI_API_KEY
npm run deploy
```
