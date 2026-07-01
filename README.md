# Inbox Triage

Paste a batch of inbound messages (emails, Slack, tickets) and Gemini classifies each by
category/urgency, extracts action items, and drafts replies for the ones that matter.

## Features

- **Batch Processing**: Handle multiple inbound messages simultaneously.
- **Auto-classification**: Automatically categorize and assess the urgency of each message.
- **Action Items**: Extract key action items from the text.
- **Draft Replies**: Generate draft responses for messages that require them.
- **Privacy First**: No database or authentication required. Results are stored in memory and `localStorage` for the current batch.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- A [Gemini API Key](https://aistudio.google.com/app/apikey)

## Stack

- Frontend: React + Vite + Tailwind v4
- Backend: Cloudflare Pages Functions (`functions/api/*`), calling the Gemini API directly via `fetch`
- No auth, no database — results live in memory + `localStorage` for the current batch

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars   # then fill in GEMINI_API_KEY
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
- `npm run test` — run tests using vitest
- `npm run test:watch` — run tests in watch mode
- `npm run deploy` — build and `wrangler pages deploy ./dist`

## Deploying

```bash
npx wrangler pages secret put GEMINI_API_KEY
npm run deploy
```
