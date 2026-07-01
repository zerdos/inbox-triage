import { callForText, AnthropicApiError } from "../_lib/anthropic";
import { draftReplyRequestSchema } from "../_lib/validation";

const DRAFT_SYSTEM_PROMPT = `You draft short, professional reply emails/messages on behalf of a busy person.
You will be given the original inbound message and its triage classification (category, urgency,
action items, summary). Write a concise reply that addresses the action items. Match the tone of
the original message. Output only the reply text, no subject line, no preamble.`;

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

  const parsed = draftReplyRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { item, triage } = parsed.data;
  const userContent = `Original message:
From: ${item.source}
Subject: ${item.subject}
Body:
${item.body}

Triage classification:
Category: ${triage.category}
Urgency: ${triage.urgency}/5
Summary: ${triage.summary}
Action items: ${triage.actionItems.join("; ") || "none"}`;

  try {
    const draft = await callForText(ctx.env.ANTHROPIC_API_KEY, {
      system: DRAFT_SYSTEM_PROMPT,
      userContent,
      maxTokens: 1024,
    });
    return Response.json({ draft });
  } catch (error) {
    if (error instanceof AnthropicApiError) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    return Response.json({ error: "Unexpected error while drafting reply" }, { status: 500 });
  }
};
