import type { AuthLoginRequest, AuthSignupRequest } from "@/types/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateSignupRequest(value: unknown): AuthSignupRequest {
  const body = validateAuthBody(value);
  const name = getOptionalName(body.name);

  return {
    email: body.email,
    password: body.password,
    name,
  };
}

export function validateLoginRequest(value: unknown): AuthLoginRequest {
  return validateAuthBody(value);
}

function validateAuthBody(value: unknown) {
  if (!isObject(value)) {
    throw new Error("Request body must be an object");
  }

  if (typeof value.email !== "string" || !EMAIL_PATTERN.test(value.email.trim())) {
    throw new Error("A valid email is required");
  }

  if (
    typeof value.password !== "string" ||
    value.password.length < MIN_PASSWORD_LENGTH
  ) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    );
  }

  return {
    email: value.email,
    password: value.password,
    name: value.name,
  };
}

function getOptionalName(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const name = value.trim();
  return name.length > 0 ? name : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
