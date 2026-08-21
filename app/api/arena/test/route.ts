import { NextResponse } from "next/server";

import { listModels } from "@/lib/models";
import { runLiveModelTest } from "@/lib/arena/live-test";

import type {
  ApiErrorResponse,
  ArenaTestRequest,
  ArenaTestResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REQUIRED_MODEL_COUNT = 2;
const MAX_INPUT_LENGTH = 4000;

export async function POST(request: Request) {
  let body: Partial<ArenaTestRequest>;

  try {
    body = (await request.json()) as Partial<ArenaTestRequest>;
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const validationError = validateArenaTestRequest(body);

  if (validationError) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Invalid live test request",
        details: [validationError],
      },
      { status: 400 },
    );
  }

  try {
    const catalogModels = await listModels();

    const modelsById = new Map(
      catalogModels.map((model) => [model.id, model]),
    );

    const modelIds = body.modelIds ?? [];

    const missingModelIds = modelIds.filter(
      (modelId) => !modelsById.has(modelId),
    );

    if (missingModelIds.length > 0) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: "Invalid live test request",
          details: [
            `Unknown modelIds: ${missingModelIds.join(", ")}`,
          ],
        },
        { status: 400 },
      );
    }

    // At this point every requested ID has been verified to exist.
    const selectedModels = modelIds.map((modelId) => {
      const model = modelsById.get(modelId);

      // This guard satisfies TypeScript and protects against
      // an unexpected lookup inconsistency.
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      return model;
    });

    const results = await Promise.all(
      selectedModels.map((model) =>
        runLiveModelTest({
          model,
          input: body.input ?? "",
        }),
      ),
    );

    if (results.length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Live model test unavailable" },
        { status: 503 },
      );
    }

    return NextResponse.json<ArenaTestResponse>({ results });
  } catch (error) {
    const errorName =
      error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to run live model test", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Live model test unavailable" },
      { status: 503 },
    );
  }
}

function validateArenaTestRequest(
  body: Partial<ArenaTestRequest>,
): string | null {
  if (!Array.isArray(body.modelIds)) {
    return "modelIds must be an array";
  }

  if (body.modelIds.length !== REQUIRED_MODEL_COUNT) {
    return `Exactly ${REQUIRED_MODEL_COUNT} modelIds are required`;
  }

  if (new Set(body.modelIds).size !== body.modelIds.length) {
    return "modelIds must be unique";
  }

  if (
    body.modelIds.some(
      (modelId) => typeof modelId !== "string" || !modelId.trim(),
    )
  ) {
    return "Each modelId must be a non-empty string";
  }

  if (typeof body.input !== "string" || !body.input.trim()) {
    return "input is required";
  }

  if (body.input.length > MAX_INPUT_LENGTH) {
    return `input must be ${MAX_INPUT_LENGTH} characters or fewer`;
  }

  return null;
}