/**
 * Utility for fetching GPS and WiFi information for the SmartScan system.
 * This file handles permission requests and provides mocks for browser environments.
 */

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Fetches the current GPS coordinates using the Geolocation API.
 * Will prompt the user for permissions if they haven't been granted yet.
 */
export async function getCurrentLocation(): Promise<GpsLocation> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Trình duyệt của bạn không hỗ trợ định vị GPS."));
      return;
    }

    // Optional: Log status message to the console or trigger custom prompt
    console.log("Đang yêu cầu quyền truy cập vị trí...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = "Không thể lấy vị trí.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Vui lòng cho phép quyền truy cập GPS để tiếp tục.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Thông tin vị trí không khả dụng.";
            break;
          case error.TIMEOUT:
            message = "Hết thời gian yêu cầu vị trí.";
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

export interface NetworkContext {
  ssid: string;
  bssid: string;
  authMethod: string;
  isFingerprinted: boolean;
}

/**
 * Gets the current Network Context (SSID, BSSID, etc.)
 * Mocked for development and browser security constraints.
 */
export async function getNetworkContext(): Promise<NetworkContext> {
  const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
  
  if (isLocal) {
    // Mock values for "Chi nhánh Quận 11 - 1"
    return {
      ssid: "HDBank_Branch_1",
      bssid: "00:11:22:33:44:01",
      authMethod: "WPA2-Enterprise",
      isFingerprinted: true,
    };
  }

  // Fallback for production (will be verified via Public IP on backend)
  return {
    ssid: "Hidden (Security Constraints)",
    bssid: "00:00:00:00:00:00",
    authMethod: "Public-IP-Auth",
    isFingerprinted: true,
  };
}
