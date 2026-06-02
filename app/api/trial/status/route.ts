/**
 * GET /api/trial/status
 * Returns current trial session status.
 * Requirements: 21.1, 21.12
 */

import { NextRequest, NextResponse } from "next/server";
import { MARKET_UI_COPY, userFacingApiError } from "@/lib/api-user-error";
import { parseTrialIdentity } from "@/lib/trial-request-identity";
import { serverTrialManagementService } from "@/services/server-trial-management.service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const identity = parseTrialIdentity(request, {});
    const status = await serverTrialManagementService.getTrialStatus(identity);

    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to get trial status", error as Error);

    return NextResponse.json(
      {
        success: false,
        error: userFacingApiError(error, MARKET_UI_COPY.account.trialStatus),
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
