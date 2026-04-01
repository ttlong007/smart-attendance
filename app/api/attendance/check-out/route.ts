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
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại." },
        { status: 401 }
      );
    }

    // 2. Parse Request Body
    const body = await request.json().catch(() => ({}));
    const { 
      latitude, longitude, wifiSsid, wifiBssid, 
      photo, accuracy, isMocked 
    } = body;
    
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin vị trí GPS." },
        { status: 400 }
      );
    }

    // 3. Obtain User Network Info (Strictly from server headers)
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                      request.ip || 
                      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const isLocal = ipAddress === "::1" || ipAddress === "127.0.0.1";

    // 4. Find valid check-in today
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
        { status: 404 }
      );
    }

    const branch = attendance.branch;

    // 5. Hard Blocking: GPS Distance & Anti-Fraud
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const distance = getDistance(lat, lng, branch.latitude, branch.longitude);
    const isWithinRange = distance <= branch.radius;
    const isGpsSpoofed = isMocked === true || accuracy === 0 || (accuracy && accuracy > 1000);

    // WiFi Audit Data
    const isCorrectSsid = !branch.allowedWifiSsid || wifiSsid === branch.allowedWifiSsid;
    const isCorrectBssid = !branch.allowedWifiBssid || wifiBssid === branch.allowedWifiBssid;

    /* OPTIONAL: Uncomment to enable strict WiFi blocking at check-out
    if (!isCorrectSsid || !isCorrectBssid) {
       return NextResponse.json(
        { success: false, message: "Môi trường mạng không hợp lệ. Vui lòng kết nối WiFi nội bộ để tan ca." },
        { status: 403 }
      );
    }
    */

    if (!isWithinRange) {
      return NextResponse.json(
        { success: false, message: `Bạn đang ở ngoài phạm vi chi nhánh (${Math.round(distance)}m). Vui lòng di chuyển vào trong để tan ca.` },
        { status: 400 }
      );
    }

    if (isGpsSpoofed) {
      return NextResponse.json(
        { success: false, message: "Phát hiện công cụ giả lập GPS khi tan ca. Hành động này đã được ghi lại." },
        { status: 403 }
      );
    }

    // 6. Photo Validation
    const isPhotoValid = typeof photo === 'string' && photo.startsWith('data:image/');
    if (!photo || !isPhotoValid) {
      return NextResponse.json(
        { success: false, message: "Yêu cầu ảnh selfie để hoàn tất tan ca." },
        { status: 400 }
      );
    }

    // 7. Verification Assessment (Priority: Public IP)
    const isIpValid = isLocal || !branch.allowedPublicIp || ipAddress === branch.allowedPublicIp;
    
    let isVerified = attendance.isVerified && isIpValid;
    let verificationNote = attendance.verificationNote;

    if (!isIpValid) {
      const ipNote = "Check-out: Truy cập ngoài mạng IP nội bộ";
      verificationNote = verificationNote 
        ? `${verificationNote}; ${ipNote}` 
        : ipNote;
    }

    // 8. Calculate total hours
    const checkInTime = new Date(attendance.checkIn);
    const checkOutTime = new Date();
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // 9. Update Record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        totalHours: totalHours,
        wifiBssid: wifiBssid || null,
        lat: lat,
        lng: lng,
        photoOut: photo, // Store check-out selfie
        isVerified: isVerified,
        verificationNote: verificationNote,
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
    });

  } catch (error: any) {
    console.error("Check-out API Error:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi thực hiện tan ca." },
      { status: 500 }
    );
  }
}
