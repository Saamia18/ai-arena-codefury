import { NextResponse } from "next/server";
import { AuthRequiredError, requireCurrentUser } from "@/lib/auth/session";
import { getArenaResultById } from "@/lib/history";
import type { ApiErrorResponse, ResultPassportResponse } from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireCurrentUser(request);
    const { id } = await params;
    const result = await getArenaResultById({
      resultId: id,
      userId: user.id,
    });

    if (!result) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Result not found" },
        { status: 404 },
      );
    }

    return NextResponse.json<ResultPassportResponse>({ result });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to fetch result passport", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
