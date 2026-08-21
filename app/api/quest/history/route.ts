import { NextResponse } from "next/server";
import { AuthRequiredError, requireCurrentUser } from "@/lib/auth/session";
import { listQuestResults } from "@/lib/history";
import type { ApiErrorResponse, QuestHistoryResponse } from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const questResults = await listQuestResults(user.id);

    return NextResponse.json<QuestHistoryResponse>({ questResults });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to list quest history", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
