import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10"));
    const search = searchParams.get("search") || "";
    const branchId = searchParams.get("branchId") || "";

    const skip = (page - 1) * pageSize;

    // Build the query where clause
    const where: any = {
      AND: []
    };

    // Search filter (Name or Email)
    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // Branch filter
    if (branchId && branchId !== "all") {
      where.AND.push({ branchId });
    }

    // If no filters applied, clean up the object
    if (where.AND.length === 0) delete where.AND;

    const [staff, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { branch: true },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      staff,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách nhân viên. Vui lòng kiểm tra lại kết nối cơ sở dữ liệu." }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, branchId } = body;

    // 1. Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Họ tên và email là bắt buộc." },
        { status: 400 }
      );
    }

    // 2. Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Định dạng email không hợp lệ." },
        { status: 400 }
      );
    }

    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng bởi một nhân viên khác." },
        { status: 409 }
      );
    }

    // 4. Validate branchId if provided
    if (branchId && branchId !== "none") {
      const branchExists = await prisma.branch.findUnique({
        where: { id: branchId }
      });
      if (!branchExists) {
        return NextResponse.json(
          { error: "Chi nhánh không tồn tại." },
          { status: 400 }
        );
      }
    }

    // 5. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: role || "STAFF",
        branchId: branchId === "none" ? null : branchId,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Error creating staff:", error);
    
    // Prisma specific error handling
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Email này đã tồn tại trong hệ thống." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo nhân viên. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
