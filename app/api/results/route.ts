import { NextResponse } from "next/server";
import { AuthRequiredError, requireCurrentUser } from "@/lib/auth/session";
import {
  getResultModelId,
  validateResultModelInput,
} from "@/lib/result/model-input";
import { explainWhyNotOthers } from "@/lib/result/why-not";
import { getModelById } from "@/lib/models";
import { saveArenaResult, listArenaResults } from "@/lib/history";
import { calculateTrustScore } from "@/lib/scoring/trust";
import { validateWeights } from "@/lib/scoring/weights";
import type {
  ApiErrorResponse,
  ResultsHistoryResponse,
  SaveResultRequest,
  SaveResultResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const results = await listArenaResults(user.id);

    return NextResponse.json<ResultsHistoryResponse>({ results });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to list results", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  let user;

  try {
    user = await requireCurrentUser(request);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    return NextResponse.json<ApiErrorResponse>(
      { error: "Authentication service unavailable" },
      { status: 503 },
    );
  }

  let body: Partial<SaveResultRequest>;

  try {
    body = (await request.json()) as Partial<SaveResultRequest>;
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const profile = validateWeights(body.profile);
    const winner = validateResultModelInput(body.winner, "winner");

    if (!Array.isArray(body.runnerUps)) {
      throw new Error("runnerUps must be an array");
    }

    const runnerUps = body.runnerUps.map((runnerUp, index) =>
      validateResultModelInput(runnerUp, `runnerUps[${index}]`),
    );

    if (typeof body.explanation !== "string" || !body.explanation.trim()) {
      throw new Error("explanation is required");
    }

    const winnerModelId = getResultModelId(winner);
    const winnerModel = await getModelById(winnerModelId);

    if (!winnerModel) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Winner model not found" },
        { status: 404 },
      );
    }

    const trustScore = calculateTrustScore(winnerModel);
    const runnerUpReasons = explainWhyNotOthers(profile, winner, runnerUps);
    const result = await saveArenaResult({
      userId: user.id,
      winner,
      runnerUps,
      trustScore,
      profile,
      explanation: body.explanation.trim(),
      runnerUpReasons,
    });

    return NextResponse.json<SaveResultResponse>({ result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (isValidationError(message)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Invalid result request", details: [message] },
        { status: 400 },
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to save result", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

function isValidationError(message: string) {
  return (
    message.includes("weights") ||
    message.includes("winner") ||
    message.includes("runnerUps") ||
    message.includes("explanation")
  );
}
