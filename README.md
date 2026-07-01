# Inbox Triage

Paste a batch of inbound messages (emails, Slack, tickets) and Claude classifies each by
category/urgency, extracts action items, and drafts replies for the ones that matter.

## Stack

- Frontend: React + Vite + Tailwind v4
- Backend: Cloudflare Pages Functions (`functions/api/*`), calling the Claude API directly via `fetch`
- No auth, no database — results live in memory + `localStorage` for the current batch

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill in ANTHROPIC_API_KEY
npx wrangler types                # regenerate Env types after touching wrangler.jsonc
```

## Local development

```bash
npm run dev
```

Runs Vite (`:5173`) and `wrangler pages dev` (`:8788`, proxying to Vite) together. Open
http://localhost:8788 — that's the port serving both the app and `/api/*` routes.

## Other commands

- `npm run typecheck` — type-check frontend + Pages Functions
- `npm run build` — production build to `dist/`
- `npm run lint` — oxlint
- `npm run deploy` — build and `wrangler pages deploy ./dist`

## Deploying

```bash
npx wrangler pages secret put ANTHROPIC_API_KEY
npm run deploy
```
