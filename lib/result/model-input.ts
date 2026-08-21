import type { ResultModelInput } from "@/types/api";
import { WEIGHT_DIMENSIONS } from "@/lib/scoring/weights";

export function validateResultModelInput(
  value: unknown,
  label: string,
): ResultModelInput {
  if (!isObject(value)) {
    throw new Error(`${label} must be an object`);
  }

  if (typeof value.name !== "string" || !value.name) {
    throw new Error(`${label}.name is required`);
  }

  if (typeof value.provider !== "string" || !value.provider) {
    throw new Error(`${label}.provider is required`);
  }

  const scores = {
    accuracy: 0,
    speed: 0,
    cost: 0,
    privacy: 0,
    easeOfUse: 0,
  };

  for (const dimension of WEIGHT_DIMENSIONS) {
    const score = value[dimension];

    if (typeof score !== "number" || !Number.isFinite(score)) {
      throw new Error(`${label}.${dimension} must be a number`);
    }

    if (score < 0 || score > 100) {
      throw new Error(`${label}.${dimension} must be between 0 and 100`);
    }

    scores[dimension] = score;
  }

  return {
    id: getOptionalString(value.id),
    modelId: getOptionalString(value.modelId),
    name: value.name,
    provider: value.provider,
    accuracy: scores.accuracy,
    speed: scores.speed,
    cost: scores.cost,
    privacy: scores.privacy,
    easeOfUse: scores.easeOfUse,
  };
}

export function getResultModelId(model: ResultModelInput) {
  return model.modelId ?? model.id ?? `${model.provider}:${model.name}`;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
