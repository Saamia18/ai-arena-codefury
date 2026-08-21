import { NextResponse } from "next/server";
import { validateResultModelInput } from "@/lib/result/model-input";
import { explainWhyNotOthers } from "@/lib/result/why-not";
import { validateWeights } from "@/lib/scoring/weights";
import type {
  ApiErrorResponse,
  WhyNotRequest,
  WhyNotResponse,
} from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Partial<WhyNotRequest>;

  try {
    body = (await request.json()) as Partial<WhyNotRequest>;
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  try {
    const profile = validateWeights(body.profile);
    const winner = validateResultModelInput(body.winner, "winner");

    if (!Array.isArray(body.others)) {
      throw new Error("others must be an array");
    }

    const others = body.others.map((model, index) =>
      validateResultModelInput(model, `others[${index}]`),
    );
    const reasons = explainWhyNotOthers(profile, winner, others);

    return NextResponse.json<WhyNotResponse>({ reasons });
  } catch (error) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Invalid why-not request",
        details: [error instanceof Error ? error.message : "Unknown error"],
      },
      { status: 400 },
    );
  }
}
