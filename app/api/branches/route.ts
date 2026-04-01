import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const all = searchParams.get("all") === "true"; // Special flag for dashboard maps/charts

    // If "all" is true, skip pagination (limit to 200 for safety)
    const queryOptions: any = {
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
    };

    if (!all) {
      queryOptions.skip = (page - 1) * pageSize;
      queryOptions.take = pageSize;
    } else {
      queryOptions.take = 200; // Cap for "all" results
    }

    const [branches, totalCount] = await Promise.all([
      prisma.branch.findMany(queryOptions),
      prisma.branch.count({ where: queryOptions.where }),
    ]);

    return NextResponse.json({
      branches,
      pagination: {
        page: all ? 1 : page,
        pageSize: all ? totalCount : pageSize,
        totalCount,
        totalPages: all ? 1 : Math.ceil(totalCount / pageSize),
      },
      // Summary for dashboard
      summary: {
        totalBranches: totalCount,
      }
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách chi nhánh. Vui lòng thử lại sau." }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address, latitude, longitude, radius, allowedWifiSsid, allowedWifiBssid, allowedPublicIp } = body;

    const ipv4Regex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;
    const ipv6Regex = /^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$/;

    // 1. Validation
    if (allowedPublicIp && !ipv4Regex.test(allowedPublicIp) && !ipv6Regex.test(allowedPublicIp)) {
      return NextResponse.json(
        { error: "Định dạng IP không hợp lệ (hỗ trợ IPv4/IPv6)." },
        { status: 400 }
      );
    }
    if (!name || !address) {
      return NextResponse.json(
        { error: "Tên và địa chỉ chi nhánh là bắt buộc." },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
      return NextResponse.json(
        { error: "Tọa độ GPS (Vĩ độ/Kinh độ) không hợp lệ." },
        { status: 400 }
      );
    }

    // 2. Create Branch
    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius) || 100,
        allowedWifiSsid: allowedWifiSsid || "",
        allowedWifiBssid: allowedWifiBssid || "",
        allowedPublicIp: allowedPublicIp ? allowedPublicIp.trim() : null,
      } as any,
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo chi nhánh. Vui lòng kiểm tra lại thông tin." }, 
      { status: 500 }
    );
  }
}
