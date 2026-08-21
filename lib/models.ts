import type { Collection, WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { AIModel, AIModelDocument } from "@/types/ai-model";

const MODELS_COLLECTION = "models";

export async function getModelsCollection(): Promise<Collection<AIModelDocument>> {
  const database = await getDatabase();
  return database.collection<AIModelDocument>(MODELS_COLLECTION);
}

export async function listModels(): Promise<AIModel[]> {
  const collection = await getModelsCollection();
  const models = await collection.find({}).sort({ name: 1 }).toArray();

  return models.map(toAIModel);
}

export async function getModelById(modelId: string): Promise<AIModel | null> {
  const collection = await getModelsCollection();
  const model = await collection.findOne({ id: modelId });

  return model ? toAIModel(model) : null;
}

function toAIModel(model: WithId<AIModelDocument>): AIModel {
  const { _id, ...modelData } = model;

  return {
    ...modelData,
    id: modelData.id ?? _id.toHexString(),
  };
}
