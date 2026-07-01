const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-5";

export class AnthropicApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AnthropicApiError";
    this.status = status;
  }
}

interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

interface CallMessagesOptions {
  system: string;
  userContent: string;
  maxTokens: number;
  tool?: ToolDefinition;
}

interface AnthropicToolUseBlock {
  type: "tool_use";
  name: string;
  input: unknown;
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicResponse {
  content: (AnthropicToolUseBlock | AnthropicTextBlock)[];
}

async function callMessages(apiKey: string, options: CallMessagesOptions): Promise<AnthropicResponse> {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: options.maxTokens,
    system: options.system,
    messages: [{ role: "user", content: options.userContent }],
  };

  if (options.tool) {
    body.tools = [options.tool];
    body.tool_choice = { type: "tool", name: options.tool.name };
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new AnthropicApiError(`Anthropic API error (${response.status}): ${detail}`, response.status);
  }

  return response.json();
}

/** Calls Claude with a forced tool call and returns the tool's structured input. */
export async function callWithTool<T>(
  apiKey: string,
  options: { system: string; userContent: string; maxTokens: number; tool: ToolDefinition },
): Promise<T> {
  const response = await callMessages(apiKey, options);
  const toolUse = response.content.find((block): block is AnthropicToolUseBlock => block.type === "tool_use");
  if (!toolUse) {
    throw new AnthropicApiError("Anthropic response did not include the expected tool call", 502);
  }
  return toolUse.input as T;
}

/** Calls Claude for a plain-text completion. */
export async function callForText(
  apiKey: string,
  options: { system: string; userContent: string; maxTokens: number },
): Promise<string> {
  const response = await callMessages(apiKey, options);
  const textBlock = response.content.find((block): block is AnthropicTextBlock => block.type === "text");
  if (!textBlock) {
    throw new AnthropicApiError("Anthropic response did not include text content", 502);
  }
  return textBlock.text;
}
