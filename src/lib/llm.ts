import OpenAI from "openai";
import { env } from "./env";

// Groq — free tier, OpenAI-compatible API. No billing required.
export function hasLLM() { return !!env.GROQ_API_KEY; }

export function groq() {
  if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");
  return new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
}

export const MODEL = "llama-3.3-70b-versatile";

export async function llmJSON<T = any>(prompt: string): Promise<T> {
  const r = await groq().chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  return JSON.parse(r.choices[0].message.content ?? "{}") as T;
}

export async function llmText(prompt: string): Promise<string> {
  const r = await groq().chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
  });
  return (r.choices[0].message.content ?? "").trim();
}
