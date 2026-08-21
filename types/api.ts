import type { AIModel } from "@/types/ai-model";

export type WeightDimension =
  | "accuracy"
  | "speed"
  | "cost"
  | "privacy"
  | "easeOfUse";

export type AIWeights = Record<WeightDimension, number>;

export type AIProfile = AIWeights;

export interface QuestAnswer {
  questionId: string;
  answer: string;
}

export interface QuestSubmitRequest {
  answers: QuestAnswer[];
}

export interface QuestSubmitResponse {
  profile: AIProfile;
}

export interface ArenaRankRequest {
  weights: AIWeights;
}

export type ArenaScoreBreakdown = AIWeights;

export interface ArenaRanking {
  rank: number;
  modelId: string;
  name: AIModel["name"];
  provider: AIModel["provider"];
  description: AIModel["description"];
  taskTypes: AIModel["taskTypes"];
  hardware: AIModel["hardware"];
  license: AIModel["license"];
  benchmarkSource: AIModel["benchmarkSource"];
  score: number;
  breakdown: ArenaScoreBreakdown;
}

export interface ArenaRankResponse {
  rankings: ArenaRanking[];
}

export interface TrustScoreRequest {
  modelId: string;
}

export type TrustScoreBreakdown = AIWeights & {
  evidence: number;
};

export interface TrustScoreResponse {
  modelId: string;
  overallTrustScore: number;
  breakdown: TrustScoreBreakdown;
}

export type ResultModelInput = Pick<
  AIModel,
  | "name"
  | "provider"
  | "accuracy"
  | "speed"
  | "cost"
  | "privacy"
  | "easeOfUse"
> & {
  id?: string;
  modelId?: string;
};

export interface ResultExplainRequest {
  profile: AIProfile;
  winner: ResultModelInput;
  runnerUp?: ResultModelInput;
}

export interface ResultExplainResponse {
  explanation: string;
}

export interface WhyNotRequest {
  profile: AIProfile;
  winner: ResultModelInput;
  others: ResultModelInput[];
}

export interface WhyNotReason {
  modelId: string;
  reason: string;
}

export interface WhyNotResponse {
  reasons: WhyNotReason[];
}

export interface ApiErrorResponse {
  error: string;
  details?: string[];
}
