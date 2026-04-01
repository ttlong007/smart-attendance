import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = new Date();
    
    // Tìm bản ghi điểm danh hôm nay của user
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        checkIn: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        }
      },
      orderBy: {
        checkIn: 'desc'
      }
    });

    if (!attendance) {
      return NextResponse.json({
        success: true,
        status: "NOT_CHECKED_IN",
        data: null
      });
    }

    if (attendance.checkOut) {
      return NextResponse.json({
        success: true,
        status: "CHECKED_OUT",
        data: attendance
      });
    }

    return NextResponse.json({
      success: true,
      status: "CHECKED_IN",
      data: attendance
    });

  } catch (error: any) {
    console.error("Attendance Status API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
