import type { ObjectId } from "mongodb";
import type {
  AIProfile,
  QuestAnswer,
  ResultModelInput,
  TrustScoreResponse,
  WhyNotReason,
} from "@/types/api";

export interface QuestResultDocument {
  _id?: ObjectId;
  userId: string;
  answers: QuestAnswer[];
  weights: AIProfile;
  createdAt: Date;
}

export interface ArenaResultDocument {
  _id?: ObjectId;
  userId: string;
  winner: ResultModelInput;
  runnerUps: ResultModelInput[];
  trustScore: TrustScoreResponse;
  profile: AIProfile;
  explanation: string;
  runnerUpReasons: WhyNotReason[];
  createdAt: Date;
}
