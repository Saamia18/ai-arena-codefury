import { NextResponse } from "next/server";
import { buildAIProfile } from "@/lib/scoring/quest";
import type {
  ApiErrorResponse,
  QuestSubmitRequest,
  QuestSubmitResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<QuestSubmitRequest>;
    const profile = buildAIProfile(body.answers);

    return NextResponse.json<QuestSubmitResponse>({ profile });
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Invalid quest answers",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 400 },
    );
  }
}
