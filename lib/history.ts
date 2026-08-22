import { ObjectId, type Collection, type WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type {
  QuestHistoryItem,
  ResultPassportResponse,
  SavedResult,
} from "@/types/api";
import type { ArenaResultDocument, QuestResultDocument } from "@/types/history";

const QUEST_RESULTS_COLLECTION = "quest_results";
const RESULTS_COLLECTION = "results";

export async function saveQuestResult({
  userId,
  answers,
  weights,
}: Omit<QuestResultDocument, "createdAt">) {
  const collection = await getQuestResultsCollection();
  const now = new Date();
  const result = await collection.insertOne({
    userId,
    answers,
    weights,
    createdAt: now,
  });

  return toQuestHistoryItem({
    _id: result.insertedId,
    userId,
    answers,
    weights,
    createdAt: now,
  });
}

export async function listQuestResults(userId: string) {
  const collection = await getQuestResultsCollection();
  const results = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  return results.map(toQuestHistoryItem);
}

export async function saveArenaResult(
  result: Omit<ArenaResultDocument, "createdAt">,
) {
  const collection = await getResultsCollection();
  const now = new Date();
  const insertResult = await collection.insertOne({
    ...result,
    createdAt: now,
  });

  return toSavedResult({
    _id: insertResult.insertedId,
    ...result,
    createdAt: now,
  });
}

export async function listArenaResults(userId: string) {
  const collection = await getResultsCollection();
  const results = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  return results.map(toSavedResult);
}

export async function getArenaResultById({
  resultId,
  userId,
}: {
  resultId: string;
  userId: string;
}): Promise<ResultPassportResponse["result"] | null> {
  if (!ObjectId.isValid(resultId)) {
    return null;
  }

  const collection = await getResultsCollection();
  const result = await collection.findOne({
    _id: new ObjectId(resultId),
    userId,
  });

  return result ? toSavedResult(result) : null;
}

async function getQuestResultsCollection(): Promise<
  Collection<QuestResultDocument>
> {
  const database = await getDatabase();
  const collection =
    database.collection<QuestResultDocument>(QUEST_RESULTS_COLLECTION);
  await collection.createIndex({ userId: 1, createdAt: -1 });

  return collection;
}

async function getResultsCollection(): Promise<Collection<ArenaResultDocument>> {
  const database = await getDatabase();
  const collection = database.collection<ArenaResultDocument>(RESULTS_COLLECTION);
  await collection.createIndex({ userId: 1, createdAt: -1 });

  return collection;
}

function toQuestHistoryItem(
  result: WithId<QuestResultDocument>,
): QuestHistoryItem {
  return {
    id: result._id.toHexString(),
    answers: result.answers,
    weights: result.weights,
    createdAt: result.createdAt.toISOString(),
  };
}

function toSavedResult(result: WithId<ArenaResultDocument>): SavedResult {
  return {
    id: result._id.toHexString(),
    userId: result.userId,
    winner: result.winner,
    runnerUps: result.runnerUps,
    trustScore: result.trustScore,
    profile: result.profile,
    explanation: result.explanation,
    runnerUpReasons: result.runnerUpReasons,
    whyNotReasons: result.runnerUpReasons,
    createdAt: result.createdAt.toISOString(),
  };
}
