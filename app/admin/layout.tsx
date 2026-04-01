"use client";

import { Building2, LayoutDashboard, Users, ShieldAlert, Settings, LogOut, Bell, Search, Menu, X, History } from "lucide-react";
import { Text, Button } from "@tremor/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, current: false },
  { name: "Nhân viên", href: "/admin/staff", icon: Users, current: false },
  { name: "Lịch sử Chấm công", href: "/admin/attendance-logs", icon: History, current: false },
  { name: "Chi nhánh", href: "/admin/branches", icon: Building2, current: false },
  { name: "Báo cáo", href: "/admin/reports", icon: Bell, current: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-500">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0f172a] shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-lg flex items-center justify-center shadow-md">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tighter text-slate-800 dark:text-white uppercase">
              Smart<span className="text-indigo-600">Scan</span>
            </span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" 
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside 
        className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] hidden lg:flex flex-col sticky top-0 h-screen w-72 shadow-sm"
      >
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
              <ShieldAlert className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-800 dark:text-white uppercase">
              Smart<span className="text-indigo-600">Scan</span>
            </span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-4 px-4 tracking-[0.2em]">Menu chính</div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400" 
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "group-hover:scale-110 transition-transform"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all w-full text-left group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 lg:h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-lg flex items-center justify-center shadow-md">
              <ShieldAlert className="text-white w-5 h-5 border-none" />
            </div>
          </div>
          
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/60 h-10 px-4 rounded-full w-96 group focus-within:ring-2 ring-indigo-500/20 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân viên, chi nhánh..." 
              className="bg-transparent border-none text-sm w-full h-full px-2 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer">
              <Bell className="w-5 h-5 text-slate-500 hover:text-indigo-600 transition-colors" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-[#0f172a] rounded-full" />
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-white">Lê Thành Long</p>
                <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Admin</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-[1px] shadow-md hover:scale-105 transition-transform cursor-pointer">
                <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center p-1">
                   <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold">LL</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden pt-4 pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}
