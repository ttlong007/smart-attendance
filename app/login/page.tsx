"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Sai email hoặc mật khẩu. Vui lòng thử lại.");
      } else {
        toast.success("Đăng nhập thành công!");
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi hệ thống.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#EE1C25] via-[#F15A22] to-[#FFCB05] relative overflow-hidden p-6">
      {/* Premium subtle glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)]" />

      <Card className="w-full max-w-sm border-none bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative z-10 overflow-hidden px-2 pt-8 pb-4">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto mb-6 scale-110">
            {/* Mock HDBank Logo Style */}
            <div className="flex items-center justify-center gap-1">
              <span className="text-4xl font-black text-[#EE1C25] tracking-tighter italic">HDBank</span>
              <div className="w-6 h-6 bg-[#EE1C25] rounded-tr-xl rounded-bl-xl rotate-12" />
            </div>
          </div>
          <CardTitle className="text-xl font-black text-slate-800 tracking-tight">
            ĐĂNG NHẬP HỆ THỐNG
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium text-xs uppercase tracking-widest">
            Xác thực nhân viên nội bộ
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Email công việc
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-300 group-focus-within:text-[#EE1C25] transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@hdbank.com.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 bg-slate-50 border-transparent text-slate-900 placeholder:text-slate-300 focus:ring-[#EE1C25]/10 focus:border-[#EE1C25] transition-all rounded-2xl py-6 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Mật khẩu bảo mật
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-300 group-focus-within:text-[#EE1C25] transition-colors" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 bg-slate-50 border-transparent text-slate-900 focus:ring-[#EE1C25]/10 focus:border-[#EE1C25] transition-all rounded-2xl py-6 h-12"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-[#EE1C25] to-[#F15A22] hover:opacity-90 text-white font-black text-sm uppercase tracking-widest rounded-2xl mt-4 border-none shadow-[0_10px_30px_rgba(238,28,37,0.3)] transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                "Vào hệ thống"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-8 text-center">
          <div className="h-1 w-12 bg-slate-100 rounded-full mx-auto" />
          <p className="text-[9px] text-slate-400 px-6 uppercase font-bold tracking-tighter leading-tight">
            Hệ thống chấm công thông minh V2.0<br/>© 2026 HDBank Security Operations
          </p>
        </CardFooter>
      </Card>

      {/* Subtle branding elements in background */}
      <div className="absolute bottom-10 opacity-10 flex flex-col items-center gap-2">
        <ShieldCheck className="text-white w-12 h-12" />
        <span className="text-white font-black tracking-widest text-[10px] uppercase">Smart Scan Security</span>
      </div>
    </div>
  );
}
