import type { AIWeights, WeightDimension } from "@/types/api";

export const WEIGHT_DIMENSIONS: WeightDimension[] = [
  "accuracy",
  "speed",
  "cost",
  "privacy",
  "easeOfUse",
];

export function isWeightDimension(value: string): value is WeightDimension {
  return WEIGHT_DIMENSIONS.includes(value as WeightDimension);
}

export function createEmptyWeights(): AIWeights {
  return {
    accuracy: 0,
    speed: 0,
    cost: 0,
    privacy: 0,
    easeOfUse: 0,
  };
}

export function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

export function validateWeights(value: unknown): AIWeights {
  if (!isObject(value)) {
    throw new Error("weights must be an object");
  }

  const weights = createEmptyWeights();
  const errors: string[] = [];

  for (const dimension of WEIGHT_DIMENSIONS) {
    const weight = value[dimension];

    if (typeof weight !== "number" || !Number.isFinite(weight)) {
      errors.push(`${dimension} must be a number`);
      continue;
    }

    if (weight < 0 || weight > 1) {
      errors.push(`${dimension} must be between 0 and 1`);
      continue;
    }

    weights[dimension] = weight;
  }

  const sum = WEIGHT_DIMENSIONS.reduce(
    (total, dimension) => total + weights[dimension],
    0,
  );

  if (Math.abs(sum - 1) > 0.001) {
    errors.push("weights must sum to approximately 1");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }

  return weights;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
