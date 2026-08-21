import { jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";
import { findUserById, toAuthUser } from "@/lib/auth/users";
import type { AuthUser } from "@/types/api";

const SESSION_COOKIE_NAME = "ai_arena_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export async function createSessionToken(user: AuthUser) {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getAuthSecret());
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  let userId: string | undefined;

  try {
    const verifiedToken = await jwtVerify(token, getAuthSecret());
    userId = verifiedToken.payload.sub;
  } catch {
    return null;
  }

  if (!userId) {
    return null;
  }

  const user = await findUserById(userId);
  return user ? toAuthUser(user) : null;
}

export async function requireCurrentUser(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new AuthRequiredError();
  }

  return user;
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [cookieName, ...valueParts] = cookie.trim().split("=");

    if (cookieName === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}
