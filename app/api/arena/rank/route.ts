import { NextResponse } from "next/server";
import { listModels } from "@/lib/models";
import { rankModels } from "@/lib/scoring/arena";
import { validateWeights } from "@/lib/scoring/weights";
import type {
  ApiErrorResponse,
  ArenaRankRequest,
  ArenaRankResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Partial<ArenaRankRequest>;

  try {
    body = (await request.json()) as Partial<ArenaRankRequest>;
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  let weights;

  try {
    weights = validateWeights(body.weights);
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Invalid arena weights",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 400 },
    );
  }

  try {
    const models = await listModels();
    const rankings = rankModels(models, weights);

    return NextResponse.json<ArenaRankResponse>({ rankings });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to rank models", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
