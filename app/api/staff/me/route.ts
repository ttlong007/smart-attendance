import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // For this assignment, we mock "me" by returning the first staff member found
    const staff = await prisma.user.findFirst({
      where: { role: "STAFF" },
      include: { branch: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin nhân viên." },
        { status: 404 }
      );
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching current staff:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống." },
      { status: 500 }
    );
  }
}
