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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] px-6 pb-6 pt-2 h-20">
      <div className="mx-auto max-w-lg h-full rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl shadow-slate-200/50 flex items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative group",
                isActive ? "text-[#005595]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className={cn(
                "p-2 rounded-2xl transition-all duration-300",
                isActive ? "bg-[#005595]/10" : "group-hover:bg-slate-100"
              )}>
                <Icon size={22} className={cn(
                  "transition-all duration-300",
                  isActive ? "scale-110" : ""
                )} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#005595] animate-in zoom-in duration-300" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
