# 📝 AI PROMPT ENGINEERING LOG - SMART ATTENDANCE V2
**Dự án:** Hệ thống Chấm công Thông minh (Scale: 100 chi nhánh / 5.000 nhân viên)  
**Tác giả:** Trần Thanh Long
**Quy trình:** Spec → AI Generate → Review & Refine → Test → Commit

---

## 🛠 GIAI ĐOẠN 1: KHỞI TẠO KIẾN TRÚC & DATABASE
| Ngày | Feature / Phase | Câu lệnh Prompt (Input) | Kết quả & Hiệu chỉnh (Output) |
| :--- | :--- | :--- | :--- |
| Day 1 | **Architecture** | "Khởi tạo project Next.js 14 App Router, Tailwind CSS, Shadcn UI. Thiết lập .cursorrules để tuân thủ Git Flow và Conventional Commits." | Khởi tạo thành công khung dự án chuẩn, cấu hình sẵn Dockerfile multi-stage. |
| Day 1 | **DB Schema** | "Thiết kế Prisma Schema hỗ trợ Multi-branch (100 chi nhánh). Đánh index cho bảng Attendance để tối ưu truy vấn 5.000 bản ghi/ngày." | Sinh Schema tối ưu; đã thêm các index cho `userId` và `branchId` để scale. |

## 🎨 GIAI ĐOẠN 2: FRONTEND & DASHBOARD UI
| Ngày | Feature / Phase | Câu lệnh Prompt (Input) | Kết quả & Hiệu chỉnh (Output) |
| :--- | :--- | :--- | :--- |
| Day 2 | **Admin Dashboard** | "Sử dụng Shadcn UI và Tremor xây dựng Dashboard tổng quan hiển thị tỷ lệ đi làm đúng giờ và cảnh báo gian lận real-time." | Giao diện hiện đại, responsive. Đã refine lại bảng danh sách để hỗ trợ Server-side Pagination. |
| Day 3 | **Branch CRUD** | "Tạo trang quản lý chi nhánh tích hợp bản đồ để cấu hình tọa độ GPS Geofencing và WiFi BSSID." | Hoàn thiện CRUD; tích hợp thêm validation cho bán kính (radius) check-in. |

## 🔒 GIAI ĐOẠN 3: BACKEND LOGIC & ANTI-FRAUD
| Ngày | Feature / Phase | Câu lệnh Prompt (Input) | Kết quả & Hiệu chỉnh (Output) |
| :--- | :--- | :--- | :--- |
| Day 4 | **Check-in API** | "Viết API xử lý Check-in: So khớp tọa độ thực tế (Haversine formula) và WiFi BSSID. Nếu sai lệch > 100m, đánh dấu vi phạm." | Logic xử lý chính xác. Đã thêm bước log IP và Device ID để ngăn chặn VPN/Fake GPS. |
| Day 4 | **PWA Mobile** | "Tạo giao diện Check-in Mobile-first, tích hợp lấy GPS và Camera để chụp ảnh xác thực." | UI tối giản cho nhân viên, tốc độ load nhanh dưới 1.5s trên 4G. |

---
*Ghi chú: 100% code