import { callWithTool, AnthropicApiError } from "../_lib/anthropic";
import { triageRequestSchema } from "../_lib/validation";
import type { TriageResult } from "../../src/types";

const TRIAGE_SYSTEM_PROMPT = `You are an inbox triage assistant. You will be given a batch of inbound
messages (emails, Slack messages, support tickets). For each message, classify it and extract
action items so a busy person can decide what to act on first.

Guidelines:
- category: a short label such as "urgent-bug", "customer", "investor", "internal", "spam", "fyi", etc. Pick whatever label best fits each message; be consistent across the batch.
- urgency: 1 (no action needed) to 5 (needs action today).
- actionItems: concrete next steps implied by the message. Empty array if none.
- summary: one sentence capturing what the message is about.

You must return exactly one result per input item, matching each item's "id".`;

const TRIAGE_TOOL = {
  name: "submit_triage",
  description: "Submit triage classifications for a batch of inbox items.",
  input_schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Must match the input item's id" },
            category: { type: "string" },
            urgency: { type: "integer", minimum: 1, maximum: 5 },
            actionItems: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
          required: ["id", "category", "urgency", "actionItems", "summary"],
        },
      },
    },
    required: ["results"],
  },
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  if (!ctx.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Server is missing ANTHROPIC_API_KEY" }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await ctx.request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = triageRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const userContent = JSON.stringify(parsed.data.items, null, 2);

  try {
    const { results } = await callWithTool<{ results: TriageResult[] }>(ctx.env.ANTHROPIC_API_KEY, {
      system: TRIAGE_SYSTEM_PROMPT,
      userContent: `Triage these items:\n${userContent}`,
      maxTokens: 4096,
      tool: TRIAGE_TOOL,
    });
    return Response.json({ results });
  } catch (error) {
    if (error instanceof AnthropicApiError) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    return Response.json({ error: "Unexpected error while triaging items" }, { status: 500 });
  }
};
