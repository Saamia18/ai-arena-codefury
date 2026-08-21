import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getMongoClient } from "../lib/mongodb";
import { curatedModels } from "../data/models";
import type { AIModelDocument } from "../types/ai-model";

const MODELS_COLLECTION = "models";

function loadLocalEnv() {
  if (process.env.MONGODB_URI) {
    return;
  }

  for (const fileName of [".env.local", ".env"]) {
    const filePath = resolve(process.cwd(), fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    const fileContent = readFileSync(filePath, "utf8");

    for (const line of fileContent.split(/\r?\n/)) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim();

      if (key === "MONGODB_URI" && value) {
        process.env.MONGODB_URI = unquoteEnvValue(value);
        return;
      }
    }
  }
}

function unquoteEnvValue(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

async function seedModels() {
  loadLocalEnv();

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  const client = await getMongoClient();

  try {
    const collection = client.db().collection<AIModelDocument>(MODELS_COLLECTION);
    const result = await collection.bulkWrite(
      curatedModels.map((model) => ({
        updateOne: {
          filter: { id: model.id },
          update: { $set: model },
          upsert: true,
        },
      })),
      { ordered: true },
    );

    console.log(
      `Seeded models collection: inserted ${result.upsertedCount}, updated ${result.modifiedCount}, matched ${result.matchedCount}.`,
    );
  } finally {
    await client.close();
  }
}

seedModels().catch((error) => {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const message = error instanceof Error ? error.message : "Unknown failure";

  console.error("Failed to seed models", {
    errorName,
    message: message.replace(
      /mongodb(?:\+srv)?:\/\/\S+/gi,
      "[redacted MongoDB URI]",
    ),
  });

  process.exit(1);
});
