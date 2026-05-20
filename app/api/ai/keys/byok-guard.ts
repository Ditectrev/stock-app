import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { subscriptionService } from "@/services/subscription.service";
import type { BYOKProvider } from "@/services/api-key-manager.service";

export function isBYOKProvider(value: string): value is BYOKProvider {
  return ["OPENAI", "GEMINI", "MISTRAL", "DEEPSEEK"].includes(value);
}

export async function getAuthorizedBYOKUser(
  request: NextRequest
): Promise<{ userId: string } | { response: NextResponse }> {
  const auth = await getAuthenticatedUser(request);
  if (!auth) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          timestamp: new Date(),
        },
        { status: 401 }
      ),
    };
  }

  const tier = await subscriptionService.getCurrentTier(auth.id);
  if (tier !== "BYOK") {
    return {
      response: NextResponse.json(
        { success: false, error: "BYOK tier required", timestamp: new Date() },
        { status: 403 }
      ),
    };
  }

  return { userId: auth.id };
}
