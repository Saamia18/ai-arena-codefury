import { NextResponse } from "next/server";
import { getModelById } from "@/lib/models";
import { calculateTrustScore } from "@/lib/scoring/trust";
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

  if (typeof body.modelId !== "string" || !body.modelId) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "modelId is required" },
      { status: 400 },
    );
  }

  try {
    const model = await getModelById(body.modelId);

    if (!model) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Model not found" },
        { status: 404 },
      );
    }

    return NextResponse.json<TrustScoreResponse>(calculateTrustScore(model));
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to calculate trust score", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
