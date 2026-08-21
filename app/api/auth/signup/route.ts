import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { createUser, findUserByEmail, toAuthUser } from "@/lib/auth/users";
import { validateSignupRequest } from "@/lib/auth/validation";
import { hashPassword } from "@/lib/auth/passwords";
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

  let signupRequest;

  try {
    signupRequest = validateSignupRequest(body);
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Invalid signup request",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 400 },
    );
  }

  try {
    const existingUser = await findUserByEmail(signupRequest.email);

    if (existingUser) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(signupRequest.password);
    const user = toAuthUser(
      await createUser({
        email: signupRequest.email,
        passwordHash,
        name: signupRequest.name,
      }),
    );
    const response = NextResponse.json<AuthResponse>({ user }, { status: 201 });
    const token = await createSessionToken(user);
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to create user", { errorName });

    return NextResponse.json<ApiErrorResponse>(
      { error: "Authentication service unavailable" },
      { status: 503 },
    );
  }
}
