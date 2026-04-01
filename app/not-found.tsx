"use client";

import Link from "next/link";
import { ArrowLeft, Home, ShieldAlert, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden p-6">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse opacity-50" />
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="max-w-2xl w-full text-center relative z-10 flex flex-col items-center">
        {/* Large 404 Visual */}
        <div className="relative mb-12 group transition-all duration-700 hover:scale-110">
          <h1 className="text-[12rem] md:text-[18rem] font-black leading-none select-none italic text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-400 to-slate-800 opacity-20 group-hover:opacity-30 transition-opacity">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center pt-8">
            <div className="p-8 rounded-[3rem] bg-slate-900 shadow-2xl ring-1 ring-white/10 backdrop-blur-3xl animate-in zoom-in-50 duration-700">
              <Ghost className="w-24 h-24 text-blue-500 animate-bounce transition-all duration-1000" />
            </div>
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Đường dẫn <span className="text-blue-500">không khả dụng</span>
          </h2>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
            Chúng tôi không tìm thấy trang bạn đang yêu cầu. Có thể nội dung đã được di chuyển hoặc quyền truy cập của bạn bị giới hạn.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Button 
            asChild
            className="h-14 px-8 bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 group"
          >
            <Link href="/" className="flex items-center gap-3">
              <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
              Về trang chủ an toàn
            </Link>
          </Button>
          
          <Button 
            asChild
            variant="ghost" 
            className="h-14 px-8 text-slate-400 hover:text-white hover:bg-white/5 font-bold rounded-2xl transition-all border border-slate-800"
          >
            <button onClick={() => window.history.back()} className="flex items-center gap-3">
              <ArrowLeft className="w-5 h-5" />
              Quay lại trang trước
            </button>
          </Button>
        </div>

        {/* Bottom Metadata */}
        <div className="mt-20 pt-10 border-t border-slate-800/50 w-full flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 grayscale opacity-30">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">HDBank Secure Infrastructure</span>
          </div>
        </div>
      </div>

      {/* Side Decorative Numbers */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-5 hidden lg:flex select-none">
        <span className="text-8xl font-black rotate-90">ERR</span>
        <span className="text-8xl font-black rotate-90 tracking-[1em]">404</span>
      </div>
    </div>
  );
}
