"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wifi,
  User,
  Building2,
  Signal,
  Fingerprint,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCurrentLocation,
  getNetworkContext,
  GpsLocation,
  NetworkContext,
} from "@/lib/sensors";
import { Info } from "lucide-react";

export default function CheckInPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const staff = session?.user as any;

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [network, setNetwork] = useState<NetworkContext | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<
    "NOT_CHECKED_IN" | "CHECKED_IN" | "CHECKED_OUT"
  >("NOT_CHECKED_IN");
  const [currentAttendance, setCurrentAttendance] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 2. Initial Setup: Sensor Data and Status Monitoring
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    const initSensors = async () => {
      try {
        const loc = await getCurrentLocation();
        setLocation(loc);
        const net = await getNetworkContext();
        setNetwork(net);
      } catch (err: any) {
        setError(err.message);
      }
    };

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/attendance/status");
        if (res.ok) {
          const data = await res.json();
          setAttendanceStatus(data.status);
          setCurrentAttendance(data.data);
        }
      } catch (err) {
        console.error("Fetch status error:", err);
      }
    };

    initSensors();
    fetchStatus();

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  // 3. Camera Handling
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Không thể truy cập camera. Vui lòng kiểm tra quyền.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setPhoto(dataUrl);

        // Stop stream
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        setIsCameraOpen(false);
      }
    }
  };

  /**
   * Creative Feature: Mock Biometric Authentication Flow
   */
  const authenticateBiometrically = async () => {
    setIsAuthenticating(true);
    // Simulate FaceID/Fingerprint scan with a delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsAuthenticating(false);
    return true; // Assume success for demo
  };

  // 4. Check-in Submit Integration
  const handleCheckIn = async () => {
    if (!location) {
      toast.error("Chưa có tọa độ GPS.");
      return;
    }

    if (!photo) {
      toast.error("Vui lòng chụp ảnh selfie.");
      startCamera();
      return;
    }

    const authed = await authenticateBiometrically();
    if (!authed) return;

    setLoading(true);
    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          wifiSsid: network?.ssid || "N/A",
          wifiBssid: network?.bssid || null,
          photo: photo,
          isMocked: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Vào ca thành công tại ${staff?.branchName || "Chi nhánh"}!`,
        );
        setAttendanceStatus("CHECKED_IN");
        setCurrentAttendance(data.data);
        setPhoto(null); // Reset photo for next action
      } else if (response.status === 401) {
        toast.error("Phiên làm việc hết hạn.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        throw new Error(data.message || "Có lỗi xảy ra.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!location) {
      toast.error("Chưa có tọa độ GPS.");
      return;
    }

    if (!photo) {
      // If no check-out photo yet, open camera
      startCamera();
      toast.info("Vui lòng chụp ảnh selfie để tan ca.");
      return;
    }

    const authed = await authenticateBiometrically();
    if (!authed) return;

    setLoading(true);
    try {
      const response = await fetch("/api/attendance/check-out", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          wifiSsid: network?.ssid || "N/A",
          wifiBssid: network?.bssid || null,
          photo: photo,
          isMocked: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Tan ca thành công. Tổng giờ làm: ${data.data.totalHours}h!`,
        );
        setAttendanceStatus("CHECKED_OUT");
        setCurrentAttendance(data.data);
      } else {
        throw new Error(data.message || "Lỗi tan ca.");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-slate-400 font-medium animate-pulse">
          Đang kiểm tra bảo mật...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center font-sans overflow-x-hidden">
      <div className="w-full bg-white border-b sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <CheckCircle2 className="text-white" size={18} />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">
            SmartScan V2
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black text-white bg-slate-900 px-3 py-1 rounded-full uppercase tracking-[0.1em]">
            Internal
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      <main className="w-full max-w-md p-6 flex flex-col gap-8 pb-32">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900">Điểm danh</h1>
          <p className="text-slate-400 text-sm font-medium">
            Xác thực danh tính đa phương thức
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-blue-900/5 overflow-hidden rounded-[2.5rem] bg-white ring-1 ring-slate-100">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="h-16 w-16 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl">
                  <User size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-blue-100/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                    Hello agent,
                  </p>
                  <h2 className="text-2xl font-black tracking-tight">
                    {staff?.name || "Member"}
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-slate-50 text-blue-600 shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Vị trí trực thuộc
                  </p>
                  <p className="text-base font-bold text-slate-800 truncate">
                    {staff?.branchName || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-3xl border-2 flex flex-col gap-2 transition-colors group relative ${isOnline ? "bg-emerald-50/30 border-emerald-100" : "bg-rose-50 border-rose-100"}`}
                >
                  <div className="flex items-center justify-between">
                    <Wifi
                      size={18}
                      className={
                        isOnline ? "text-emerald-500" : "text-rose-500"
                      }
                    />
                    <div className="relative">
                      <Info
                        size={14}
                        className="text-slate-300 cursor-help peer"
                      />
                      <div className="absolute bottom-full mb-2 right-0 w-48 p-2 bg-slate-900 text-white text-[9px] rounded-lg opacity-0 peer-hover:opacity-100 pointer-events-none transition-opacity z-[110] shadow-xl border border-slate-700">
                        Vì lý do bảo mật, trình duyệt Web sẽ ẩn thông tin phần
                        cứng WiFi. Hệ thống tự động chuyển sang lớp bảo mật IP
                        Public để xác định vị trí chi nhánh.
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    Xác thực mạng
                  </p>
                  <p
                    className={`text-[11px] font-black leading-tight ${isOnline ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {network?.authMethod === "Public-IP-Auth"
                      ? "Dấu vân tay mạng (Public IP)"
                      : network?.ssid || "Đang kiểm tra..."}
                  </p>

                  {/* Security Flow Diagram (Micro-visual) */}
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-1 w-4 bg-emerald-500/30 rounded-full" />
                    <div className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
                    <div className="h-1 w-4 bg-emerald-500/30 rounded-full" />
                  </div>
                </div>

                <div
                  className={`p-4 rounded-3xl border-2 flex flex-col gap-2 transition-colors ${location ? "bg-emerald-50/30 border-emerald-100" : "bg-rose-50 border-rose-100"}`}
                >
                  <div className="flex items-center justify-between">
                    <Signal
                      size={18}
                      className={
                        location ? "text-emerald-500" : "text-rose-500"
                      }
                    />
                    <div
                      className={`h-2 w-2 rounded-full ${location ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                    />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    Satellite GPS
                  </p>
                  <p
                    className={`text-sm font-black ${location ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {location ? "Khả dụng" : "Mất tín hiệu"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-8 py-4">
          <div className="text-center space-y-1">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-sm">
              {new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </h3>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.1em]">
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
              })}
            </p>
          </div>

          <div className="relative">
            <div
              className={`absolute -inset-8 rounded-full bg-blue-500/10 animate-ping duration-[4s] ${loading || isAuthenticating ? "hidden" : ""}`}
            />

            <Button
              onClick={
                attendanceStatus === "CHECKED_IN"
                  ? handleCheckOut
                  : photo
                    ? handleCheckIn
                    : startCamera
              }
              disabled={
                loading ||
                !location ||
                !isOnline ||
                isAuthenticating ||
                attendanceStatus === "CHECKED_OUT"
              }
              className={`relative h-56 w-56 rounded-full flex flex-col items-center justify-center gap-2 shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all active:scale-95 overflow-hidden border-[12px] border-slate-50 ${
                attendanceStatus === "CHECKED_OUT"
                  ? "bg-slate-200 text-slate-400"
                  : attendanceStatus === "CHECKED_IN"
                    ? "bg-gradient-to-br from-rose-500 to-red-600"
                    : photo
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                      : "bg-gradient-to-br from-blue-600 to-indigo-700"
              }`}
            >
              {loading || isAuthenticating ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Loader2 className="h-14 w-14 animate-spin text-white opacity-20" />
                    <Fingerprint className="absolute inset-0 m-auto h-8 w-8 text-white animate-pulse" />
                  </div>
                  <span className="font-black text-[10px] tracking-[0.2em] text-white/80 animate-pulse uppercase">
                    {isAuthenticating ? "Verifying Bio..." : "Encrypting..."}
                  </span>
                </div>
              ) : attendanceStatus === "CHECKED_OUT" ? (
                <>
                  <CheckCircle2 size={56} className="mb-2" />
                  <span className="font-black text-xs tracking-tighter uppercase">
                    Hoàn thành ngày
                  </span>
                </>
              ) : attendanceStatus === "CHECKED_IN" ? (
                <>
                  <Camera size={52} className="text-white mb-2" />
                  <span className="font-black text-xl tracking-tight leading-none uppercase">
                    Tan ca
                  </span>
                  <div className="h-1 w-8 bg-white/30 rounded-full mt-1" />
                </>
              ) : photo ? (
                <>
                  <CheckCircle2
                    size={56}
                    className="text-white mb-2 animate-in zoom-in-50 duration-300"
                  />
                  <span className="font-black text-base tracking-tighter">
                    XÁC NHẬN
                  </span>
                </>
              ) : (
                <>
                  <Camera size={52} className="text-white mb-2" />
                  <span className="font-black text-xl tracking-tight leading-none">
                    Vào ca
                  </span>
                  <div className="h-1 w-8 bg-white/30 rounded-full mt-1" />
                </>
              )}
              {photo && !loading && !isAuthenticating && (
                <img
                  src={photo}
                  className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay grayscale"
                  alt="preview"
                />
              )}
            </Button>
          </div>
        </div>

        {isCameraOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="relative w-full aspect-square max-w-sm rounded-[3.5rem] overflow-hidden border-8 border-white/5 shadow-[0_0_80px_rgba(59,130,246,0.3)]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[80%] h-[80%] border-2 border-white/20 border-dashed rounded-full flex items-center justify-center">
                  <div className="w-[90%] h-[90%] border border-blue-500/30 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-24 h-24 rounded-full bg-white p-2 shadow-2xl active:scale-90 transition-transform"
                >
                  <div className="w-full h-full rounded-full border-4 border-slate-900 bg-slate-900 flex items-center justify-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  </div>
                </button>
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center gap-2">
              <p className="text-white text-xl font-black">
                Xác thực khuôn mặt
              </p>
              <p className="text-slate-400 text-sm font-medium">
                Vui lòng giữ điện thoại ổn định
              </p>
            </div>
            <button
              onClick={() => setIsCameraOpen(false)}
              className="absolute top-10 right-10 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            >
              <AlertCircle size={24} />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-6 rounded-[2rem] border-2 border-rose-100/50 animate-in slide-in-from-bottom-8">
            <div className="p-2 bg-rose-500 rounded-xl text-white">
              <AlertCircle size={20} />
            </div>
            <p className="text-xs font-black leading-relaxed shrink-1 uppercase tracking-tight">
              {error}
            </p>
          </div>
        )}
      </main>

      <footer className="mt-auto py-10 w-full flex flex-col items-center gap-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            HDBank Secure Cloud
          </span>
        </div>
        <div className="flex gap-6 opacity-20">
          <Fingerprint size={16} />
          <Wifi size={16} />
          <MapPin size={16} />
        </div>
      </footer>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
