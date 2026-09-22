import { NextResponse } from "next/server";

import { getAiStatusVerified } from "@/lib/ai/client";

/**
 * Tells the UI which engine will actually score answers.
 *
 * This verifies the provider rather than merely detecting a configured key, so
 * the header can never advertise an AI engine that is silently falling back.
 * The probe is cached for a few minutes. It reports availability only — never
 * the key, the endpoint, or any provider detail beyond the model name.
 */
export async function GET() {
  const status = await getAiStatusVerified();
  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
