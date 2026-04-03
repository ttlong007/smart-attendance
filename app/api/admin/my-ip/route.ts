import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/my-ip
 * Returns the client's IP address as detected by the server.
 * This is useful for admins to configure the correct IP in the branch settings.
 */
export async function GET(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                    request.ip || 
                    "127.0.0.1";
                    
  return NextResponse.json({ ip: ipAddress });
}
