/**
 * AI Provider Abstraction
 *
 * Supports multiple AI backends via the AI_PROVIDER env var:
 *   - "mock"   → returns a canned response (no API key needed, great for testing)
 *   - "openai"  → OpenAI ChatCompletion API
 *   - "gemini"  → Google Gemini API
 *   - "ollama"  → Local Ollama instance (OpenAI-compatible endpoint)
 *
 * Environment variables:
 *   AI_PROVIDER   – one of the above (default: "mock")
 *   AI_API_KEY    – API key for openai / gemini
 *   AI_BASE_URL   – base URL override (e.g. http://localhost:11434/v1 for Ollama)
 *   AI_MODEL      – model name override (default per-provider)
 */

import { readServerEnv } from "./server-env";

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export type AiResponse = {
  content: string;
  confidence: "high" | "medium" | "low";
  sources: { tool: string; label: string; excerpt: string }[];
};

function getProviderConfig() {
  const provider = (readServerEnv("AI_PROVIDER") || "mock").toLowerCase();
  const apiKey = readServerEnv("AI_API_KEY") || "";
  const baseUrl = readServerEnv("AI_BASE_URL") || "";
  const model = readServerEnv("AI_MODEL") || "";
  return { provider, apiKey, baseUrl, model };
}

// ─── Mock Provider ───────────────────────────────────────────
function mockAnswer(question: string): AiResponse {
  return {
    content:
      `Based on the available project context, here is what I found regarding your question: "${question}"\n\n` +
      `This is a mock response generated because no AI provider is configured. ` +
      `To enable real AI answers, set the AI_PROVIDER environment variable to "openai", "gemini", or "ollama" ` +
      `and provide the corresponding AI_API_KEY.\n\n` +
      `Once configured, TeamMind will analyze your connected sources (Slack messages, Jira tickets, ` +
      `Google Drive documents, and Confluence pages) to synthesize a comprehensive answer with citations.`,
    confidence: "medium",
    sources: [
      { tool: "TeamMind", label: "Mock Response", excerpt: "This is a placeholder — configure an AI provider for real answers." },
    ],
  };
}

// ─── OpenAI-Compatible Provider (works for OpenAI, Ollama, etc.) ──
async function openaiCompatibleAnswer(
  messages: AiMessage[],
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<string> {
  const url = `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };

  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Gemini Provider ─────────────────────────────────────────
async function geminiAnswer(
  messages: AiMessage[],
  apiKey: string,
  model: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Convert messages to Gemini format
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // Prepend system instruction as first user message if present
  const systemMsg = messages.find((m) => m.role === "system");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      ...(systemMsg
        ? { systemInstruction: { parts: [{ text: systemMsg.content }] } }
        : {}),
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    candidates: { content: { parts: { text: string }[] } }[];
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── Main Entry Point ────────────────────────────────────────
const SYSTEM_PROMPT = `You are TeamMind AI, a knowledge retrieval assistant for software engineering teams.

When answering questions:
1. Be specific and cite the source tools (Slack, Jira, Google Drive, Confluence) when you reference information.
2. Structure your answer clearly with paragraphs.
3. If information is uncertain, say so.
4. Keep answers concise but thorough.

You MUST respond with valid JSON in this exact format:
{
  "content": "Your detailed answer text here. Use multiple paragraphs for clarity.",
  "confidence": "high" | "medium" | "low",
  "sources": [
    { "tool": "Slack", "label": "#channel-name · date", "excerpt": "relevant quote" },
    { "tool": "Jira", "label": "TICKET-123", "excerpt": "relevant quote" },
    { "tool": "Google Drive", "label": "document-name.pdf", "excerpt": "relevant quote" },
    { "tool": "Confluence", "label": "Page Title", "excerpt": "relevant quote" }
  ]
}

Confidence levels:
- "high": Multiple sources agree, information is recent and clear
- "medium": Some sources available but incomplete or slightly outdated
- "low": Very limited information, mostly inference

The "sources" array should contain only the sources you actually reference. Include realistic excerpts.`;

function parseAiResponse(raw: string): AiResponse {
  // Try to parse as JSON
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      content: parsed.content || raw,
      confidence: ["high", "medium", "low"].includes(parsed.confidence) ? parsed.confidence : "medium",
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch {
    // If JSON parsing fails, return the raw text as content
    return {
      content: raw,
      confidence: "medium",
      sources: [],
    };
  }
}

export async function generateAnswer(
  question: string,
  projectContext: string,
): Promise<AiResponse> {
  const { provider, apiKey, baseUrl, model } = getProviderConfig();

  const messages: AiMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Project context:\n${projectContext}\n\nQuestion: ${question}`,
    },
  ];

  switch (provider) {
    case "mock":
      return mockAnswer(question);

    case "openai": {
      const raw = await openaiCompatibleAnswer(
        messages,
        apiKey,
        baseUrl || "https://api.openai.com/v1",
        model || "gpt-4o-mini",
      );
      return parseAiResponse(raw);
    }

    case "gemini": {
      const raw = await geminiAnswer(messages, apiKey, model || "gemini-2.0-flash");
      return parseAiResponse(raw);
    }

    case "ollama": {
      const raw = await openaiCompatibleAnswer(
        messages,
        "", // Ollama doesn't need an API key
        baseUrl || "http://localhost:11434/v1",
        model || "llama3.2",
      );
      return parseAiResponse(raw);
    }

    default:
      console.warn(`Unknown AI_PROVIDER "${provider}", falling back to mock`);
      return mockAnswer(question);
  }
}
