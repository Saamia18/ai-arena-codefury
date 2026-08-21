import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { findUserByEmail, toAuthUser } from "@/lib/auth/users";
import { validateLoginRequest } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/passwords";
import type { ApiErrorResponse, AuthResponse } from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  let loginRequest;

  try {
    loginRequest = validateLoginRequest(body);
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Invalid login request",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 400 },
    );
  }

  try {
    const user = await findUserByEmail(loginRequest.email);
    const passwordMatches = user
      ? await verifyPassword(loginRequest.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const authUser = toAuthUser(user);
    const response = NextResponse.json<AuthResponse>({ user: authUser });
    const token = await createSessionToken(authUser);
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to login user", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Authentication service unavailable" },
      { status: 503 },
    );
  }
}
