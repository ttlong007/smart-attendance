import * as React from "react";
import { BottomNav } from "@/components/BottomNav";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <main>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
