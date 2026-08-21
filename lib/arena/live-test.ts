import type { AIModel } from "@/types/ai-model";
import type { ArenaTestResult } from "@/types/api";
import {
  generateLiveModelResponse,
  GROQ_LIVE_TEST_MODEL,
} from "@/lib/result/groq";

const LIVE_MODEL_ADAPTERS: Record<string, { provider: "groq"; model: string }> = {
  "openai-gpt-4o": {
    provider: "groq",
    model: GROQ_LIVE_TEST_MODEL,
  },
};

export async function runLiveModelTest({
  model,
  input,
}: {
  model: AIModel;
  input: string;
}): Promise<ArenaTestResult> {
  const adapter = LIVE_MODEL_ADAPTERS[model.id];

  if (!adapter) {
    return createFallbackResult({
      model,
      latency: 0,
      response:
        "Live testing is not available for this model with the current provider configuration.",
    });
  }

  const startedAt = Date.now();

  try {
    const response = await generateLiveModelResponse({
      modelName: model.name,
      provider: model.provider,
      input,
    });

    return {
      modelId: model.id,
      name: model.name,
      response,
      latency: Date.now() - startedAt,
    };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Live model test failed", {
      modelId: model.id,
      provider: adapter.provider,
      errorName,
    });

    return createFallbackResult({
      model,
      latency: Date.now() - startedAt,
      response:
        "Live response unavailable right now. Please try this model again later.",
    });
  }
}

function createFallbackResult({
  model,
  response,
  latency,
}: {
  model: AIModel;
  response: string;
  latency: number;
}): ArenaTestResult {
  return {
    modelId: model.id,
    name: model.name,
    response,
    latency,
    fallback: true,
  };
}
