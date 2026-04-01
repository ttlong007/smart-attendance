import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, differenceInMinutes } from "date-fns";



export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    const where: any = {};

    if (startDateStr && endDateStr) {
      where.checkIn = {
        gte: startOfDay(parseISO(startDateStr)),
        lte: endOfDay(parseISO(endDateStr)),
      };
    }

    if (branchId && branchId !== "all") {
      where.branchId = branchId;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: true,
        branch: true,
      },
      orderBy: { checkIn: "desc" },
    });

    const reportData = attendances.map((record) => {
      let durationMinutes = 0;
      if (record.checkIn && record.checkOut) {
        durationMinutes = differenceInMinutes(
          new Date(record.checkOut),
          new Date(record.checkIn)
        );
      }

      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return {
        id: record.id,
        userName: record.user.name,
        userEmail: record.user.email,
        branchName: record.branch.name,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        duration: `${hours}h ${minutes}m`,
        durationMinutes,
        status: record.status,
        isVerified: record.isVerified,
      };
    });

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
