import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { startOfDay, endOfDay } from "date-fns";

// Haversine formula to calculate distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function PATCH(request: NextRequest) {
  const HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };

  try {
    const session = await auth();
    
    // 3. Obtain User Network Info (Standard for Vercel/Proxy environments)
    const ipAddress = 
      request.headers.get("x-real-ip") || 
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
      request.ip || 
      "127.0.0.1";
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại." },
        { status: 401, headers: HEADERS }
      );
    }

    // DEBUG LOG: For Public IP Change monitoring
    console.log(`[IP-DEBUG] Check-out User: ${session.user.id} | IP: ${ipAddress}`);

    // 4. Parse Request Body
    const body = await request.json().catch(() => ({}));
    const { 
      latitude, longitude, wifiSsid, wifiBssid,
      photo, accuracy, isMocked 
    } = body;
    
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin vị trí GPS." },
        { status: 400, headers: HEADERS }
      );
    }

    const userAgent = request.headers.get("user-agent") || "unknown";

    // 5. Find valid check-in today
    const today = new Date();
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        checkIn: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
        checkOut: null
      },
      orderBy: { checkIn: 'desc' },
      include: { branch: true }
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy lượt vào ca hợp lệ hôm nay để thực hiện tan ca." },
        { status: 404, headers: HEADERS }
      );
    }

    const branch = attendance.branch;

    // 6. Hard Blocking: GPS Distance & Anti-Fraud
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const distance = getDistance(lat, lng, branch.latitude, branch.longitude);
    const isWithinRange = distance <= branch.radius;
    const isGpsSpoofed = isMocked === true || accuracy === 0 || (accuracy && accuracy > 1000);

    if (!isWithinRange) {
      return NextResponse.json(
        { success: false, message: `Bạn đang ở ngoài phạm vi chi nhánh (${Math.round(distance)}m). Vui lòng di chuyển vào trong để tan ca.` },
        { status: 403, headers: HEADERS }
      );
    }

    if (isGpsSpoofed) {
      return NextResponse.json(
        { success: false, message: "Phát hiện công cụ giả lập GPS khi tan ca. Hành động này đã được ghi lại." },
        { status: 403, headers: HEADERS }
      );
    }

    // 7. Hard Blocking: Public IP Validation
    const allowedIps = branch.allowedPublicIp 
      ? branch.allowedPublicIp.split(',').map(ip => ip.trim()).filter(ip => ip !== "")
      : [];

    const isIpValid = allowedIps.length === 0 || allowedIps.includes(ipAddress);
    
    if (!isIpValid) {
      console.warn(`[SECURITY-ALERT] Blocked Check-out from unauthorized IP: ${ipAddress} | User: ${session.user.id}`);
      return NextResponse.json({
        success: false,
        message: "Bạn đang sử dụng mạng (IP) không hợp lệ. Vui lòng kết nối WiFi văn phòng để tan ca.",
        data: {
          detectedIp: ipAddress
        }
      }, { status: 403, headers: HEADERS });
    }

    // 8. Photo Validation
    const isPhotoValid = typeof photo === 'string' && photo.startsWith('data:image/');
    if (!photo || !isPhotoValid) {
      return NextResponse.json(
        { success: false, message: "Yêu cầu ảnh selfie để hoàn tất tan ca." },
        { status: 400, headers: HEADERS }
      );
    }

    // 9. Calculate total hours
    const checkInTime = new Date(attendance.checkIn);
    const checkOutTime = new Date();
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // 10. Update Record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        totalHours: totalHours,
        wifiBssid: wifiBssid || null,
        lat: lat,
        lng: lng,
        photoOut: photo, 
        isVerified: true, // Since it passed both GPS and IP check
        verificationNote: attendance.verificationNote, 
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: "Tan ca thành công. Chúc bạn một ngày tốt lành!",
      data: {
        checkIn: attendance.checkIn,
        checkOut: updatedAttendance.checkOut,
        totalHours: (updatedAttendance as any).totalHours
      }
    }, { status: 200, headers: HEADERS });

  } catch (error: any) {
    console.error("Check-out API Error:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi thực hiện tan ca." },
      { status: 500, headers: HEADERS }
    );
  }
}
