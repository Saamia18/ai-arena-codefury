import type { AIWeights, ResultModelInput, WhyNotReason } from "@/types/api";
import { roundScore, WEIGHT_DIMENSIONS } from "@/lib/scoring/weights";
import { getResultModelId } from "@/lib/result/model-input";

const readableDimensionNames = {
  accuracy: "accuracy",
  speed: "speed",
  cost: "cost efficiency",
  privacy: "privacy",
  easeOfUse: "ease of use",
} as const;

export function explainWhyNotOthers(
  profile: AIWeights,
  winner: ResultModelInput,
  others: ResultModelInput[],
): WhyNotReason[] {
  const prioritizedDimensions = [...WEIGHT_DIMENSIONS].sort((first, second) => {
    if (profile[second] !== profile[first]) {
      return profile[second] - profile[first];
    }

    return WEIGHT_DIMENSIONS.indexOf(first) - WEIGHT_DIMENSIONS.indexOf(second);
  });

  return others.map((model) => {
    const losingDimension = findMostImportantLosingDimension(
      prioritizedDimensions,
      winner,
      model,
    );
    const strongestDimension = findStrongestDimension(model);

    return {
      modelId: getResultModelId(model),
      reason: buildReason(model, losingDimension, strongestDimension),
    };
  });
}

function findMostImportantLosingDimension(
  prioritizedDimensions: typeof WEIGHT_DIMENSIONS,
  winner: ResultModelInput,
  model: ResultModelInput,
) {
  return (
    prioritizedDimensions.find((dimension) => model[dimension] < winner[dimension]) ??
    prioritizedDimensions[0]
  );
}

function findStrongestDimension(model: ResultModelInput) {
  return [...WEIGHT_DIMENSIONS].sort((first, second) => {
    if (model[second] !== model[first]) {
      return model[second] - model[first];
    }

    return WEIGHT_DIMENSIONS.indexOf(first) - WEIGHT_DIMENSIONS.indexOf(second);
  })[0];
}

function buildReason(
  model: ResultModelInput,
  losingDimension: (typeof WEIGHT_DIMENSIONS)[number],
  strongestDimension: (typeof WEIGHT_DIMENSIONS)[number],
) {
  if (losingDimension === strongestDimension) {
    return `${model.name} is competitive on ${readableDimensionNames[strongestDimension]}, but it still scores lower than the winner on that priority.`;
  }

  return `${model.name} is strong on ${readableDimensionNames[strongestDimension]}, but it scores lower than the winner on your higher-priority ${readableDimensionNames[losingDimension]} criterion.`;
}

export function calculateWeightedGap(
  profile: AIWeights,
  winner: ResultModelInput,
  model: ResultModelInput,
) {
  return roundScore(
    WEIGHT_DIMENSIONS.reduce(
      (total, dimension) =>
        total + Math.max(winner[dimension] - model[dimension], 0) * profile[dimension],
      0,
    ),
  );
}
