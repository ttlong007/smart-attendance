import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  // Giả lập 5000 người dùng tăng dần trong 1 phút
  stages: [
    { duration: "30s", target: 5000 },
    { duration: "1m", target: 5000 },
    { duration: "30s", target: 0 },
  ],
};

export default function () {
  const url = "http://localhost:3000/api/auth/callback/credentials";

  // Giả lập ID ngẫu nhiên từ 101 - 5000
  const userId = Math.floor(Math.random() * 4900) + 101;
  const payload = JSON.stringify({
    email: `staff${userId}@hdbank.com.vn`,
    password: "123456",
    redirect: false,
  });

  const params = {
    headers: { "Content-Type": "application/json" },
  };

  // 1. Test Đăng nhập
  const loginRes = http.post(url, payload, params);
  check(loginRes, { "login success": (r) => r.status === 200 });

  sleep(1); // Chờ 1 giây như người dùng thật

  // 2. Test Check-in (Nếu cần)
  const checkInUrl = "http://localhost:3000/api/attendance/check-in";
  const checkInPayload = JSON.stringify({
    userId: `user_id_here`, // Cần lấy ID từ session nếu test sâu hơn
    lat: 10.7769,
    lng: 106.7009,
    wifiSsid: "HDBank_Wifi",
  });

  http.post(checkInUrl, checkInPayload, params);
}
