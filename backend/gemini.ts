export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

interface GeminiChatOptions {
  prompt: string;
  systemContext?: string;
  jsonMode?: boolean;
  maxOutputTokens?: number;
}

// Server-side Gemini LLM proxy. The API key lives only in the backend
// environment and is never exposed to the browser.
export async function runGeminiChat(options: GeminiChatOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const { prompt, systemContext, jsonMode, maxOutputTokens = 4096 } = options;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const body: Record<string, unknown> = {
    generationConfig: {
      maxOutputTokens,
      temperature: 0.4,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    ...(systemContext ? { systemInstruction: { parts: [{ text: systemContext }] } } : {}),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = (await res.json()) as any;
  const text =
    (data?.candidates?.[0]?.content?.parts || [])
      .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
      .join('')
      .trim() || '';
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }
  return text;
}