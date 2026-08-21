import Groq from "groq-sdk";
import type { AIWeights, ResultModelInput } from "@/types/api";

export const GROQ_EXPLANATION_MODEL = "openai/gpt-oss-120b";

let groqClient: Groq | undefined;

export async function generateWinnerExplanation({
  profile,
  winner,
  runnerUp,
}: {
  profile: AIWeights;
  winner: ResultModelInput;
  runnerUp?: ResultModelInput;
}) {
  const client = getGroqClient();
  const completion = await client.chat.completions.create({
    model: GROQ_EXPLANATION_MODEL,
    temperature: 0.2,
    max_completion_tokens: 120,
    reasoning_effort: "low",
    messages: [
      {
        role: "system",
        content:
          "You explain deterministic AI model ranking results for non-technical users. Do not calculate rankings. Do not invent benchmark facts. Use only the supplied JSON data. Keep the answer to two short sentences.",
      },
      {
        role: "user",
        content: JSON.stringify({
          profile,
          winner,
          runnerUp,
          instruction:
            "Explain why the winner is the best fit for this user's weighted priorities.",
        }),
      },
    ],
  });
  const explanation = extractExplanationText(completion.choices[0]?.message);

  if (!explanation) {
    throw new Error("Groq returned an empty explanation");
  }

  return explanation;
}

function extractExplanationText(message: {
  content?: string | Array<{ text?: string }> | null;
}) {
  if (typeof message.content === "string") {
    return message.content.trim();
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => part.text)
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  return "";
}

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  groqClient ??= new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  return groqClient;
}
