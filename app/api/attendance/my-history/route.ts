import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { startOfMonth, endOfMonth } from "date-fns";

/**
 * GET /api/attendance/my-history
 * Returns attendance history for the authenticated user, optionally filtered by month/year.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get("month"); // 1-12
    const yearStr = searchParams.get("year");   // e.g. 2024

    let where: any = {
      userId: session.user.id,
    };

    if (monthStr && yearStr) {
      const month = parseInt(monthStr) - 1; // 0-indexed for JS Date
      const year = parseInt(yearStr);
      const date = new Date(year, month);
      
      where.checkIn = {
        gte: startOfMonth(date),
        lte: endOfMonth(date),
      };
    }

    const history = await prisma.attendance.findMany({
      where,
      orderBy: {
        checkIn: "desc",
      },
      include: {
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error("Fetch history error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
