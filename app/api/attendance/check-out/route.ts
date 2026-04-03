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
    
    // 1. Obtain User Network Info ASAP for logging
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                      request.ip || 
                      "127.0.0.1";
    
    // DEBUG LOG: For Public IP Change monitoring
    console.log(`[CHECK-OUT] IP: ${ipAddress} | Time: ${new Date().toISOString()} | User: ${session?.user?.email || "Unknown"}`);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại." },
        { status: 401, headers: HEADERS }
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
        { status: 400, headers: HEADERS }
      );
    }

    const userAgent = request.headers.get("user-agent") || "unknown";

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
        { status: 404, headers: HEADERS }
      );
    }

    const branch = attendance.branch;

    // SECURITY LOG: Log check-out IP info
    console.log(`[SECURITY-CHECKOUT] Detected IP: ${ipAddress} | User: ${session.user.id}`);

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
        { status: 400, headers: HEADERS }
      );
    }

    if (isGpsSpoofed) {
      return NextResponse.json(
        { success: false, message: "Phát hiện công cụ giả lập GPS khi tan ca. Hành động này đã được ghi lại." },
        { status: 403, headers: HEADERS }
      );
    }

    // 6. Photo Validation
    const isPhotoValid = typeof photo === 'string' && photo.startsWith('data:image/');
    if (!photo || !isPhotoValid) {
      return NextResponse.json(
        { success: false, message: "Yêu cầu ảnh selfie để hoàn tất tan ca." },
        { status: 400, headers: HEADERS }
      );
    }

    // 7. Verification Assessment (Priority: Public IP)
    // Support multiple allowed IPs (comma-separated) to handle IPv4/IPv6 dual-stack
    const allowedIps = branch.allowedPublicIp 
      ? branch.allowedPublicIp.split(',').map(ip => ip.trim()).filter(ip => ip !== "")
      : [];

    const isIpValid = allowedIps.length === 0 || allowedIps.includes(ipAddress);
    
    if (allowedIps.length > 0) {
      console.log(`[SECURITY-CHECKOUT] Verification: ${isIpValid ? 'PASSED' : 'FAILED'}`);
      console.log(`[SECURITY-CHECKOUT] Expected one of: [${allowedIps.join(', ')}] | Detected: ${ipAddress}`);
    }

    if (!isIpValid) {
      return NextResponse.json({
        success: false,
        message: "Tan ca bị từ chối do truy cập ngoài mạng IP nội bộ.",
        data: {
          ipAddress: ipAddress,
          allowedIps: allowedIps
        }
      }, { status: 400, headers: HEADERS });
    }

    // 8. Calculate total hours
    const checkInTime = new Date(attendance.checkIn);
    const checkOutTime = new Date();
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // 9. Update Record
    // Since we blocked !isIpValid, we know isIpValid is true here.
    // The session remains verified if it was already verified at check-in.
    const isVerified = attendance.isVerified; 

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        totalHours: totalHours,
        wifiBssid: wifiBssid || null,
        lat: lat,
        lng: lng,
        photoOut: photo, 
        isVerified: isVerified,
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
