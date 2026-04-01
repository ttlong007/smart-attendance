import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * GET /api/admin/dashboard/stats
 * Returns high-level stats for the Dashboard Cards.
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
    const startOfYesterday = startOfDay(subDays(today, 1));
    const endOfYesterday = endOfDay(subDays(today, 1));

    // 1. Total Employees & Branches
    const [totalEmployees, totalBranches] = await Promise.all([
      prisma.user.count({ where: { role: "STAFF" } }),
      prisma.branch.count(),
    ]);

    // 2. Attendance Stats (Today)
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        checkIn: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const onTimeToday = todayAttendances.filter(a => a.status === "ON_TIME").length;
    const totalToday = todayAttendances.length || 1; // Avoid division by zero
    const onTimeRateToday = (onTimeToday / totalToday) * 100;

    // 3. Attendance Stats (Yesterday for trend)
    const yesterdayAttendances = await prisma.attendance.findMany({
      where: {
        checkIn: {
          gte: startOfYesterday,
          lte: endOfYesterday,
        },
      },
    });
    const onTimeYesterday = yesterdayAttendances.filter(a => a.status === "ON_TIME").length;
    const totalYesterday = yesterdayAttendances.length || 1;
    const onTimeRateYesterday = (onTimeYesterday / totalYesterday) * 100;
    const onTimeTrend = onTimeRateToday - onTimeRateYesterday;

    // 4. Violations (Today)
    // We consider "isVerified = false" or "status = ABSENT" as violations/anomalies for the card
    const violationsToday = todayAttendances.filter(a => !a.isVerified).length;

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees: {
          value: totalEmployees,
          trend: "+24 trong tháng", // Mocked trend
        },
        totalBranches: {
          value: totalBranches,
          trend: "Toàn quốc",
        },
        onTimeRate: {
          value: `${onTimeRateToday.toFixed(1)}%`,
          trend: `${onTimeTrend >= 0 ? "+" : ""}${onTimeTrend.toFixed(1)}% so với hôm qua`,
          isPositive: onTimeTrend >= 0,
        },
        violations: {
          value: violationsToday,
          trend: violationsToday > 0 ? "Cần xử lý ngay" : "Hệ thống an toàn",
          isCritical: violationsToday > 0,
        }
      }
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
