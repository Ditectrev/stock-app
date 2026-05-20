import { NextRequest, NextResponse } from "next/server";
import { appwriteAIKeyStoreService } from "@/services/appwrite-ai-key-store.service";
import { getAuthorizedBYOKUser, isBYOKProvider } from "../byok-guard";

/**
 * Validates a BYOK API key with the upstream provider without persisting it.
 * Used by the browser client before encrypting the key to localStorage.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthorizedBYOKUser(request);
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as { provider?: string; apiKey?: string };
  const provider = body.provider?.trim().toUpperCase() ?? "";
  const apiKey = body.apiKey?.trim() ?? "";

  if (!isBYOKProvider(provider) || !apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "provider and apiKey are required",
        timestamp: new Date(),
      },
      { status: 400 }
    );
  }

  const result = await appwriteAIKeyStoreService.validateKey(provider, apiKey);
  if (!result.valid) {
    return NextResponse.json(
      {
        success: false,
        error: result.error ?? "Invalid API key",
        timestamp: new Date(),
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { provider },
    timestamp: new Date(),
  });
}
