"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fingerprint, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Chấm công",
    icon: Fingerprint,
    href: "/check-in",
  },
  {
    label: "Lịch sử",
    icon: History,
    href: "/history",
  },
  {
    label: "Cá nhân",
    icon: User,
    href: "/profile",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-8 left-0 right-0 z-[100] px-6">
      <div className="mx-auto max-w-sm h-18 rounded-[2.5rem] bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-4 transition-all duration-500 relative group min-w-[70px]",
                isActive ? "text-[#EE1C25]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className={cn(
                "p-2.5 rounded-2xl transition-all duration-500 mb-1",
                isActive ? "bg-red-50 shadow-sm shadow-red-200/50" : "group-hover:bg-slate-50"
              )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn(
                  "transition-all duration-500",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest transition-all duration-500",
                isActive ? "opacity-100" : "opacity-40 group-hover:opacity-60"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 w-8 h-1 bg-gradient-to-r from-[#EE1C25] to-[#F15A22] rounded-full animate-in slide-in-from-bottom-1 duration-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
