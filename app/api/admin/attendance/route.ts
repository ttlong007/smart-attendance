import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { startOfDay, endOfDay } from "date-fns";

/**
 * GET /api/admin/attendance
 * Returns all attendance records with filtering for Admin Dashboard.
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

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const branchId = searchParams.get("branchId");

    let where: any = {};

    // Default to today if no date range is specified
    const today = new Date();
    const startDate = startDateParam ? new Date(startDateParam) : startOfDay(today);
    const endDate = endDateParam ? new Date(endDateParam) : endOfDay(today);

    where.checkIn = {
      gte: startDate,
      lte: endDate,
    };

    if (branchId && branchId !== "all") {
      where.branchId = branchId;
    }

    const rawLogs = await prisma.attendance.findMany({
      where,
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
            allowedPublicIp: true,
            latitude: true,
            longitude: true,
            radius: true,
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
    console.error("Fetch admin logs error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
