import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

import { startOfDay } from "date-fns";

/**
 * GET /api/admin/attendance/latest
 * Returns the 5 most recent attendance records for the Dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = new Date();
    const startOfToday = startOfDay(today);

    const rawLogs = await prisma.attendance.findMany({
      where: {
        checkIn: {
          gte: startOfToday,
        },
      },
      take: 5,
      orderBy: {
        checkIn: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            email: true,
          },
        },
        branch: {
          select: {
            name: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    // Helper for Haversine distance
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371000; // Earth radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const logs = rawLogs.map(log => {
      const distance = calculateDistance(
        log.lat, 
        log.lng, 
        log.branch.latitude, 
        log.branch.longitude
      );
      return {
        ...log,
        distance
      };
    });

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error("Fetch latest admin logs error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
