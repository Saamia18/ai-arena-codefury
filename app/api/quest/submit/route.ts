import { NextResponse } from "next/server";
import { AuthRequiredError, requireCurrentUser } from "@/lib/auth/session";
import { saveQuestResult } from "@/lib/history";
import { buildAIProfile } from "@/lib/scoring/quest";
import type {
  ApiErrorResponse,
  QuestSubmitRequest,
  QuestSubmitResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  let body: Partial<QuestSubmitRequest>;
  let profile;

  try {
    body = (await request.json()) as Partial<QuestSubmitRequest>;
    profile = buildAIProfile(body.answers);
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Invalid quest answers",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 400 },
    );
  }

  try {
    const questResult = await saveQuestResult({
      userId: user.id,
      answers: body.answers ?? [],
      weights: profile,
    });

    return NextResponse.json<QuestSubmitResponse>({
      profile,
      questResultId: questResult.id,
      createdAt: questResult.createdAt,
    });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to save quest result", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
