import { nextJsHandler } from "@convex-dev/better-auth/nextjs";
import { createAuth } from "@/lib/auth-server";
import { logger } from "@/utils/logger";
import { NextRequest, NextResponse } from "next/server";

// Initialize handler with error checking
let handler: ReturnType<typeof nextJsHandler> | null = null;

try {
  // Note: We don't validate env vars here because:
  // 1. They're server-side only (no NEXT_PUBLIC_ prefix) - correct for sensitive keys
  // 2. createAuth will validate them when actually called
  // 3. This allows the module to load even if env vars aren't set yet (helpful for development)
  
  handler = nextJsHandler(createAuth);
} catch (error) {
  logger.error("Failed to initialize Better Auth handler:", {
    error,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  throw error;
}

export async function GET(request: NextRequest) {
  try {
    if (!handler) {
      logger.error("Auth handler not initialized");
      return NextResponse.json(
        { error: "Auth handler not initialized" },
        { status: 500 }
      );
    }
    
    const response = await handler.GET(request);
    
    if (!response.ok) {
      const text = await response.clone().text().catch(() => "Unable to read response");
      logger.error("Auth GET handler returned error response:", {
        status: response.status,
        statusText: response.statusText,
        body: text,
        pathname: request.nextUrl.pathname,
      });
    }
    
    return response;
  } catch (error) {
    logger.error("Error in auth GET handler:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pathname: request.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!handler) {
      logger.error("Auth handler not initialized");
      return NextResponse.json(
        { error: "Auth handler not initialized" },
        { status: 500 }
      );
    }
    
    const response = await handler.POST(request);
    
    if (!response.ok) {
      const body = await request.clone().json().catch(() => null);
      const text = await response.clone().text().catch(() => "Unable to read response");
      logger.error("Auth POST handler returned error response:", {
        status: response.status,
        statusText: response.statusText,
        body: text,
        pathname: request.nextUrl.pathname,
        requestBody: body ? { ...body, password: body.password ? "[REDACTED]" : undefined } : null,
      });
    }
    
    return response;
  } catch (error) {
    logger.error("Error in auth POST handler:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pathname: request.nextUrl.pathname,
    });
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

