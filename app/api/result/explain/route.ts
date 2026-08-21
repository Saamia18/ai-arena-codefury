import { NextResponse } from "next/server";
import { generateWinnerExplanation } from "@/lib/result/groq";
import { validateResultModelInput } from "@/lib/result/model-input";
import { validateWeights } from "@/lib/scoring/weights";
import type {
  ApiErrorResponse,
  ResultExplainRequest,
  ResultExplainResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Partial<ResultExplainRequest>;

  try {
    body = (await request.json()) as Partial<ResultExplainRequest>;
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const profile = validateWeights(body.profile);
    const winner = validateResultModelInput(body.winner, "winner");
    const runnerUp = body.runnerUp
      ? validateResultModelInput(body.runnerUp, "runnerUp")
      : undefined;
    const explanation = await generateWinnerExplanation({
      profile,
      winner,
      runnerUp,
    });

    return NextResponse.json<ResultExplainResponse>({ explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (isInputError(message)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Invalid explanation request", details: [message] },
        { status: 400 },
      );
    }

    console.error(
      "Unable to generate result explanation",
      getSafeGroqErrorDetails(error),
    );

    return NextResponse.json<ApiErrorResponse>(
      { error: "Explanation service unavailable" },
      { status: 503 },
    );
  }
}

function isInputError(message: string) {
  return (
    message.includes("weights") ||
    message.includes("winner") ||
    message.includes("runnerUp")
  );
}

function getSafeGroqErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      errorName: "UnknownError",
    };
  }

  const groqError = error as Error & {
    status?: number;
    code?: string | number;
    type?: string;
  };

  return {
    errorName: error.name,
    message: sanitizeErrorMessage(error.message),
    status: groqError.status,
    code: groqError.code,
    type: groqError.type,
  };
}

function sanitizeErrorMessage(message: string) {
  let sanitizedMessage = message.replace(
    /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
    "Bearer [redacted]",
  );

  if (process.env.GROQ_API_KEY) {
    sanitizedMessage = sanitizedMessage.replaceAll(
      process.env.GROQ_API_KEY,
      "[redacted Groq API key]",
    );
  }

  if (process.env.MONGODB_URI) {
    sanitizedMessage = sanitizedMessage.replaceAll(
      process.env.MONGODB_URI,
      "[redacted MongoDB URI]",
    );
  }

  return sanitizedMessage;
}
