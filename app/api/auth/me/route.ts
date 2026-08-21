import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import type { ApiErrorResponse, AuthMeResponse } from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);

    return NextResponse.json<AuthMeResponse>({ user });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to load current user", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Authentication service unavailable" },
      { status: 503 },
    );
  }
}
