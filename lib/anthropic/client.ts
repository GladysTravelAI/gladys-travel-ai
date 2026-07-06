// lib/anthropic/client.ts
// 🔐 ANTHROPIC CLIENT — SERVER SIDE ONLY
// Singleton Claude client + shared helpers used across every GladysTravelAI AI route.

import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ==================== MODEL TIERS ====================
// Mirrors the old OpenAI split (gpt-4o = heavy, gpt-4o-mini = fast), plus a
// "standard" tier for the agentic tool-calling companion chat, which needs
// more reliability than a fast/light model but doesn't need Opus.
//
// heavy    -> claude-opus-4-8            : rich long-form content (itineraries,
//             AI-fallback trip building) — was gpt-4o
// standard -> claude-sonnet-5            : agentic tool-calling chat (Gladys
//             companion) — upgraded from gpt-4o-mini for tool-call reliability
// fast     -> claude-haiku-4-5-20251001  : classification, extraction, short
//             single-shot completions — was gpt-4o-mini / gpt-5-mini

export const MODELS = {
  heavy: 'claude-opus-4-8',
  standard: 'claude-sonnet-5',
  fast: 'claude-haiku-4-5-20251001',
} as const;

// Drop-in analogue of the old OPENAI_CONFIG (used by app/api/agent/route.ts).
export const CLAUDE_CONFIG = {
  model: MODELS.heavy,
  temperature: 0.3,
  max_tokens: 4000,
} as const;

// ==================== STRUCTURED JSON OUTPUT ====================
//
// Anthropic doesn't have an OpenAI-style `response_format: json_object` flag.
// The reliable equivalent is a FORCED tool call: give Claude one tool and set
// tool_choice to force it, and the model must reply with a valid JSON object
// matching the tool's input_schema — no markdown fences, no chatty preamble,
// nothing to strip. The schema is intentionally loose (just "an object") since
// the real shape is already spelled out in the prompt, matching how the old
// json_object mode worked (guarantees valid JSON syntax, not a specific shape).

export async function getJSONCompletion({
  system,
  user,
  model = MODELS.fast,
  maxTokens = 4000,
  temperature = 0.3,
}: {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<any> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [{ role: 'user', content: user }],
    tools: [
      {
        name: 'output_json',
        description: 'Return the structured output for this request as a single JSON object.',
        input_schema: { type: 'object' },
      },
    ],
    tool_choice: { type: 'tool', name: 'output_json' },
  });

  const block = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
  );
  return block ? block.input : null;
}

// ==================== PLAIN TEXT OUTPUT ====================
// For free-form prose replies (no JSON forcing).

export async function getTextCompletion({
  system,
  messages,
  model = MODELS.fast,
  maxTokens = 1000,
  temperature = 0.7,
}: {
  system?: string;
  messages: Anthropic.MessageParam[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages,
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}
