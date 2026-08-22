import type { AIModel } from "@/types/ai-model";
import type {
  ResultModelInput,
  TrustScoreBreakdown,
  TrustScoreResponse,
} from "@/types/api";
import { getResultModelId } from "@/lib/result/model-input";
import { roundScore } from "@/lib/scoring/weights";

const TRUST_FACTOR_WEIGHTS = {
  accuracy: 0.28,
  speed: 0.12,
  cost: 0.1,
  privacy: 0.2,
  easeOfUse: 0.1,
  evidence: 0.2,
} as const;

export function calculateTrustScore(model: AIModel): TrustScoreResponse {
  const evidenceQuality = calculateEvidenceQuality(model.benchmarkSource);
  const breakdown: TrustScoreBreakdown = {
    accuracy: roundScore(model.accuracy * TRUST_FACTOR_WEIGHTS.accuracy),
    speed: roundScore(model.speed * TRUST_FACTOR_WEIGHTS.speed),
    cost: roundScore(model.cost * TRUST_FACTOR_WEIGHTS.cost),
    privacy: roundScore(model.privacy * TRUST_FACTOR_WEIGHTS.privacy),
    easeOfUse: roundScore(model.easeOfUse * TRUST_FACTOR_WEIGHTS.easeOfUse),
    evidence: roundScore(evidenceQuality * TRUST_FACTOR_WEIGHTS.evidence),
  };
  const overallTrustScore = roundScore(
    breakdown.accuracy +
      breakdown.speed +
      breakdown.cost +
      breakdown.privacy +
      breakdown.easeOfUse +
      breakdown.evidence,
  );

  return {
    modelId: model.id,
    overallTrustScore,
    breakdown,
  };
}

export function calculateTrustScoreFromResultModel(
  model: ResultModelInput,
): TrustScoreResponse {
  return calculateTrustScore({
    id: getResultModelId(model),
    name: model.name,
    provider: model.provider,
    description: "",
    taskTypes: [],
    accuracy: model.accuracy,
    speed: model.speed,
    cost: model.cost,
    privacy: model.privacy,
    easeOfUse: model.easeOfUse,
    hardware: "",
    license: "",
    benchmarkSource: "",
  });
}

function calculateEvidenceQuality(benchmarkSource: string) {
  const normalizedSource = benchmarkSource.trim().toLowerCase();

  if (!normalizedSource) {
    return 0;
  }

  if (
    normalizedSource.includes("todo") ||
    normalizedSource.includes("provisional") ||
    normalizedSource.includes("placeholder")
  ) {
    return 35;
  }

  if (
    normalizedSource.includes("http://") ||
    normalizedSource.includes("https://") ||
    normalizedSource.includes("benchmark")
  ) {
    return 90;
  }

  return 70;
}
