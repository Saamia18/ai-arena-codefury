import { NextResponse } from "next/server";
import { listModels } from "@/lib/models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const models = await listModels();

    return NextResponse.json({ models });
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";

    console.error("Unable to fetch models", { errorName });

    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
