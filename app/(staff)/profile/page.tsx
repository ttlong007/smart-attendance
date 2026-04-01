"use client";

import * as React from "react";
import { useState } from "react";
import { 
  User, 
  Building2, 
  Briefcase, 
  Calendar, 
  Moon, 
  Sun, 
  Lock, 
  MessageSquare, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const staff = session?.user as any;

  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Đã đăng xuất thành công.");
      router.push("/login");
    } catch (error) {
      toast.error("Lỗi khi đăng xuất.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Header with HDBank Gradient */}
      <div className="bg-gradient-to-br from-[#005595] to-[#0082c8] pt-12 pb-24 px-6 rounded-b-[3rem] shadow-xl shadow-blue-900/10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white/30 p-1 bg-white/10 backdrop-blur-md">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {staff?.image ? (
                  <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-[#005595]" />
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {staff?.name || "Thanh Long"}
            </h1>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">
              Mã NV: {staff?.employeeId || "NV-2026-007"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-6 pb-12">
        {/* Job Information Card */}
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Thông tin công việc</h3>
            
            <div className="space-y-1">
              <ProfileItem 
                icon={Building2} 
                label="Chi nhánh" 
                value={staff?.branchName || "Chi nhánh Quận 11 - 1"} 
              />
              <ProfileItem 
                icon={Briefcase} 
                label="Bộ phận" 
                value="Phòng Phát triển Phần mềm" 
              />
              <ProfileItem 
                icon={Calendar} 
                label="Ngày tham gia" 
                value="01/01/2026" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Cài đặt & Tiện ích</h3>
            
            <div className="space-y-1">
              {/* Custom Switch for Dark Mode */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 group transition-colors hover:bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <span className="text-sm font-bold text-slate-700">Chế độ tối</span>
                </div>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-[#005595]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <button className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 group transition-colors hover:bg-white text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-600 text-sm">
                    <Lock size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Đổi mật khẩu</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>

              <button className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 group transition-colors hover:bg-white text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 text-sm">
                    <MessageSquare size={18} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Hỗ trợ kỹ thuật</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button 
          onClick={handleLogout}
          variant="ghost"
          className="w-full h-16 rounded-[2rem] bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-black gap-3 transition-all active:scale-[0.98]"
        >
          <LogOut size={20} />
          <span>ĐĂNG XUẤT HỆ THỐNG</span>
        </Button>

        {/* Footer */}
        <div className="text-center py-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            HDBank Secure Cloud v1.0.0
          </p>
          <p className="text-[9px] text-slate-300 font-medium">
            Phát triển bởi Thanh Long
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-2xl transition-colors hover:bg-slate-50/50">
      <div className="p-2 rounded-xl bg-blue-50 text-[#005595]">
        <Icon size={18} />
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
        <span className="text-sm font-bold text-slate-700">{value}</span>
      </div>
    </div>
  );
}
