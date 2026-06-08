/**
 * POST /api/trial/end
 * Ends the current trial session.
 * Requirements: 21.1, 21.12
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { parseTrialIdentity } from "@/lib/trial-request-identity";
import { serverTrialManagementService } from "@/services/server-trial-management.service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      fingerprint?: string;
      userAgent?: string;
      screenResolution?: string;
      timezone?: string;
    };
    const identity = parseTrialIdentity(request, body);
    await serverTrialManagementService.endTrial(identity);

    return NextResponse.json({
      success: true,
      data: { ended: true },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to end trial", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.account.trialEnd),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
