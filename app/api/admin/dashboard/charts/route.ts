import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { startOfDay, endOfDay, format } from "date-fns";

/**
 * GET /api/admin/dashboard/charts
 * Returns data for Hourly Check-in Density and Branch Performance.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // 1. Hourly Density (06:00 to 14:00)
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        checkIn: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        checkIn: true,
      },
    });

    const hourlyCounts: Record<string, number> = {};
    // Initialize hours from 06:00 to 23:00 to cover the full banking operations and late shifts
    for (let i = 6; i <= 23; i++) {
        const h = i < 10 ? `0${i}:00` : `${i}:00`;
        hourlyCounts[h] = 0;
    }

    todayAttendances.forEach(a => {
        const hour = format(a.checkIn, "HH:00");
        if (hourlyCounts.hasOwnProperty(hour)) {
            hourlyCounts[hour]++;
        }
    });

    const hourlyData = Object.entries(hourlyCounts).map(([hour, count]) => ({
        hour,
        "Lượt check-in": count,
    }));

    // 2. Branch Performance
    // To be accurate, we need total staff per branch vs checked-in staff today
    const branches = await prisma.branch.findMany({
        include: {
            _count: {
                select: { users: true }
            },
            attendances: {
                where: {
                    checkIn: {
                        gte: startOfToday,
                        lte: endOfToday,
                    }
                }
            }
        }
    });

    const branchPerformance = branches
        .map(b => ({
            name: b.name,
            "Tỷ lệ check-in": b._count.users > 0 
                ? Math.round((b.attendances.length / b._count.users) * 100) 
                : 0
        }))
        .sort((a, b) => b["Tỷ lệ check-in"] - a["Tỷ lệ check-in"])
        .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        hourlyData,
        branchPerformance,
      }
    });
  } catch (error: any) {
    console.error("Dashboard charts error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
