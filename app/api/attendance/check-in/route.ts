import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Haversine formula to calculate the distance between two points in meters.
 * Used for GPS validation against branch radius.
 */
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

/**
 * POST /api/attendance/check-in
 * Strictly validates check-in attempts using multi-factor verification:
 * 1. GPS Location (within branch radius)
 * 2. Network (WiFi SSID and BSSID/MAC Address)
 * 3. Public IP (match allowed office IP)
 * 4. Identity (Selfie photo requirement)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate and extract User ID
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse Request Body
    const body = await request.json().catch(() => ({}));
    const { 
      latitude, longitude, wifiSsid, wifiBssid, photo,
      accuracy, isMocked 
    } = body;

    // Basic requirement check
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, message: "Thiếu dữ liệu vị trí GPS." },
        { status: 400 }
      );
    }

    // 3. Obtain User Network Info (Strictly from server headers)
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                      request.ip || 
                      "127.0.0.1";
    
    // SECURITY LOG: Log every check-in attempt's IP
    console.log(`[SECURITY-CHECKIN] Detected IP: ${ipAddress} | User: ${userId}`);

    const userAgent = request.headers.get("user-agent") || "unknown";

    // 4. Fetch User and Branch Configuration
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { branch: true },
    });

    if (!user || !user.branch) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy thông tin nhân viên hoặc chi nhánh." },
        { status: 404 }
      );
    }

    const branch = user.branch;

    // 5. Hard Blocking: GPS Distance Check
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const distance = getDistance(lat, lng, branch.latitude, branch.longitude);
    const isWithinRange = distance <= branch.radius;

    if (!isWithinRange) {
      // STRICT BLOCK: Return 400 immediately, no record created.
      return NextResponse.json(
        { 
          success: false, 
          message: `Bạn đang ở ngoài phạm vi chi nhánh (${Math.round(distance)}m > ${branch.radius}m). Vui lòng di chuyển vào trong.` 
        },
        { status: 400 }
      );
    }

    // 6. Verification Status Assessment (Priority: Public IP)
    // Support multiple allowed IPs (comma-separated) to handle IPv4/IPv6 dual-stack
    const allowedIps = branch.allowedPublicIp 
      ? branch.allowedPublicIp.split(',').map(ip => ip.trim()).filter(ip => ip !== "")
      : [];
    
    const isIpValid = allowedIps.length === 0 || allowedIps.includes(ipAddress);
    
    if (allowedIps.length > 0) {
      console.log(`[SECURITY-CHECKIN] Verification: ${isIpValid ? 'PASSED' : 'FAILED'}`);
      console.log(`[SECURITY-CHECKIN] Expected one of: [${allowedIps.join(', ')}] | Detected: ${ipAddress}`);
    }
    
    // Non-blocking WiFi & Anti-Fraud for Audit Trail
    const isCorrectSsid = !branch.allowedWifiSsid || wifiSsid === branch.allowedWifiSsid;
    const isCorrectBssid = !branch.allowedWifiBssid || wifiBssid === branch.allowedWifiBssid;

    /* OPTIONAL: Uncomment to enable strict WiFi blocking
    if (!isCorrectSsid || !isCorrectBssid) {
      return NextResponse.json(
        { success: false, message: "Môi trường mạng không hợp lệ. Vui lòng kết nối WiFi chi nhánh." },
        { status: 403 }
      );
    }
    */

    const isGpsSpoofed = isMocked === true || accuracy === 0 || (accuracy && accuracy > 1000);
    const isPhotoValid = typeof photo === 'string' && photo.startsWith('data:image/');

    const auditFailures: string[] = [];
    if (!isIpValid) auditFailures.push(`Truy cập ngoài mạng IP nội bộ (IP: ${ipAddress})`);
    if (!isCorrectSsid) auditFailures.push(`Sai WiFi SSID: ${wifiSsid}`);
    if (!isCorrectBssid) auditFailures.push("Sai WiFi BSSID/MAC");
    if (isGpsSpoofed) auditFailures.push("Nghi ngờ giả lập GPS");
    if (!photo) auditFailures.push("Thiếu ảnh selfie");
    else if (!isPhotoValid) auditFailures.push("Ảnh selfie không hợp lệ");

    // Final isVerified decision (IP is the hard requirement for "Verified" status)
    const isVerified = isIpValid; 
    const verificationNote = isVerified 
      ? (auditFailures.length > 0 ? `Audit: ${auditFailures.join("; ")}` : null)
      : "Truy cập ngoài mạng IP nội bộ";

    // 7. Determine Attendance Status (Standard: 9:00 AM)
    const now = new Date();
    const threshold = new Date();
    threshold.setHours(9, 0, 0, 0);
    const status = now > threshold ? "LATE" : "ON_TIME";

    // 8. Persist Attendance Record
    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        branchId: branch.id,
        lat: lat,
        lng: lng,
        wifiSsid: wifiSsid || "N/A",
        wifiBssid: wifiBssid || null,
        status: status,
        isVerified: isVerified,
        verificationNote: verificationNote,
        ipAddress: ipAddress,
        userAgent: userAgent,
        photo: photo, 
      },
    });

    // 9. Return Response
    if (isVerified) {
      return NextResponse.json({
        success: true,
        message: `Check-in thành công tại ${branch.name}!`,
        data: {
          attendanceId: attendance.id,
          status: status,
          time: attendance.checkIn,
          isVerified: true
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Check-in bị từ chối do vi phạm quy tắc an ninh.",
        data: {
          attendanceId: attendance.id,
          isVerified: false,
          reasons: auditFailures,
          ipAddress: ipAddress,
        }
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Check-in API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
