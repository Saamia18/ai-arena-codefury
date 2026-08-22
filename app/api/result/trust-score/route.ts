import { NextResponse } from "next/server";
import { validateResultModelInput } from "@/lib/result/model-input";
import { getModelById } from "@/lib/models";
import {
  calculateTrustScore,
  calculateTrustScoreFromResultModel,
} from "@/lib/scoring/trust";
import type {
  ApiErrorResponse,
  TrustScoreRequest,
  TrustScoreResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Partial<TrustScoreRequest>;

  try {
    body = (await request.json()) as Partial<TrustScoreRequest>;
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const hasModelId = typeof body.modelId === "string" && Boolean(body.modelId);
  const hasWinner = body.winner !== undefined;

  if (!hasModelId && !hasWinner) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "modelId is required" },
      { status: 400 },
    );
  }

  try {
    if (hasModelId && body.modelId) {
      try {
        const model = await getModelById(body.modelId);

        if (model) {
          return NextResponse.json<TrustScoreResponse>(calculateTrustScore(model));
        }
      } catch (error) {
        if (!hasWinner) {
          throw error;
        }
      }
    }

    if (hasWinner) {
      const winner = validateResultModelInput(body.winner, "winner");
      return NextResponse.json<TrustScoreResponse>(
        calculateTrustScoreFromResultModel(winner),
      );
    }

    return NextResponse.json<ApiErrorResponse>(
      { error: "Model not found" },
      { status: 404 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("winner")) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Invalid trust score request", details: [message] },
        { status: 400 },
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to calculate trust score", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
