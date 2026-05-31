/**
 * POST /api/trial/start
 * Starts a new trial session.
 * Requirements: 21.1, 21.12
 */

import { NextRequest, NextResponse } from "next/server";
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
    const session = await serverTrialManagementService.startTrial(identity);

    return NextResponse.json({
      success: true,
      data: session,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error("Failed to start trial", error as Error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to start trial session",
        timestamp: new Date(),
      },
      { status: 403 }
    );
  }
}
