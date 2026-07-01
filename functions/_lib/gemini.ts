const MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export class GeminiApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
  }
}

interface GenerateContentOptions {
  system: string;
  userContent: string;
  maxTokens: number;
  responseSchema?: Record<string, unknown>;
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

async function generateContent(apiKey: string, options: GenerateContentOptions): Promise<string> {
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: options.maxTokens,
  };

  if (options.responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = options.responseSchema;
  }

  const body = {
    contents: [{ role: "user", parts: [{ text: options.userContent }] }],
    systemInstruction: { parts: [{ text: options.system }] },
    generationConfig,
  };

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new GeminiApiError(`Gemini API error (${response.status}): ${detail}`, response.status);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text === undefined) {
    throw new GeminiApiError("Gemini response did not include any content", 502);
  }
  return text;
}

/** Calls Gemini with a forced JSON response schema and returns the parsed structured output. */
export async function callWithSchema<T>(
  apiKey: string,
  options: { system: string; userContent: string; maxTokens: number; schema: Record<string, unknown> },
): Promise<T> {
  const text = await generateContent(apiKey, {
    system: options.system,
    userContent: options.userContent,
    maxTokens: options.maxTokens,
    responseSchema: options.schema,
  });
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GeminiApiError("Gemini response was not valid JSON", 502);
  }
}

/** Calls Gemini for a plain-text completion. */
export function callForText(
  apiKey: string,
  options: { system: string; userContent: string; maxTokens: number },
): Promise<string> {
  return generateContent(apiKey, options);
}
