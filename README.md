# 🛡️ Smart Attendance System

Hệ thống chấm công thông minh sử dụng Next.js, Tailwind CSS và Prisma.

> [!IMPORTANT]
> Hệ thống sử dụng cơ chế xác thực 3 lớp (GPS + BSSID + Public IP) để loại bỏ hoàn toàn việc check-in từ các vị trí lân cận tòa nhà.

Hệ thống quản lý chấm công đa chi nhánh, hỗ trợ 100 chi nhánh và 5.000 nhân viên với cơ chế chống gian lận đa lớp.

## 🚀 Hướng dẫn cài đặt & Chạy thử
1. `git clone <repo-url>`
2. `npm install` && `cp .env.example .env`
3. `npx prisma db push` && `npx prisma db seed`
4. `npm run dev`
5. Truy cập: `http://localhost:3000`

## 🔑 Tài khoản thử nghiệm (HDBank Demo)
| Vai trò | Email đăng nhập | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Quản trị (Admin)** | `staff1@hdbank.com.vn` | `123456` | Toàn quyền Dashboard & Logs |
| **Nhân viên (Staff)** | `staff101@hdbank.com.vn` | `123456` | Check-in/out & Lịch sử cá nhân |

> [!TIP]
> Bạn có thể sử dụng bất kỳ email nào từ `staff1` đến `staff10` cho quyền Admin, và `staff101` đến `staff5000` cho quyền Nhân viên.

## 🛠️ Tech Stack
- **Frontend/Backend:** Next.js 14 (App Router) - Tối ưu hóa render phía server (SSR).
- **Database:** PostgreSQL + Prisma ORM.
- **Security:** WebAuthn (Sinh trắc học), Geofencing (GPS), WiFi BSSID Tracking.

## 📈 Chiến lược mở rộng (Scaling Strategy)
Để đáp ứng 5.000 nhân viên check-in cùng lúc vào khung giờ cao điểm (8:00 - 8:30):
- [cite_start]**Database Indexing:** Đánh chỉ mục (index) cho `userId`, `branchId` và `checkInTime` để tăng tốc độ truy vấn báo cáo[cite: 12].
- **Stateless Architecture:** Backend Next.js chạy độc lập, dễ dàng scale ngang (Horizontal Scaling) qua Docker Swarm hoặc K8s.
- **Connection Pooling:** Sử dụng PgBouncer để quản lý hàng nghìn kết nối vào Database đồng thời mà không gây nghẽn.

## 🏆 Tính năng Sáng tạo & Khác biệt
- **Dual-Factor Location:** Bắt buộc khớp cả GPS và WiFi BSSID (địa chỉ MAC của Router) để ngăn chặn Fake GPS hoàn toàn.
- [cite_start]**Biometric Verification:** Tích hợp FaceID/Vân tay qua trình duyệt (WebAuthn) để xác thực chính chủ[cite: 23].
- **Dual-Check-in/out:** Hệ thống yêu cầu xác thực 2 lần (Vào/Ra) để đảm bảo nhân viên có mặt tại văn phòng trong suốt thời gian làm việc, tối ưu hóa việc tính lương và overtime