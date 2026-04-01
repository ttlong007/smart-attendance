"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { AttendanceCharts } from "@/components/dashboard/attendance-charts";
import { RecentAttendanceTable } from "@/components/dashboard/recent-attendance-table";
import { Title, Text, Flex, Button, DateRangePicker } from "@tremor/react";
import { Download, Filter } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="p-6 md:p-10 mx-auto max-w-7xl animate-in fade-in duration-700">
      <Flex justifyContent="between" alignItems="end" className="mb-8 flex-col md:flex-row gap-4">
        <div className="space-y-1">
          <Title className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Dashboard Tổng quan
          </Title>
          <Text className="text-muted-foreground text-lg">
            Hệ thống giám sát chấm công thông minh v2.0
          </Text>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button icon={Filter} variant="secondary" className="shadow-sm">Bộ lọc</Button>
          <Button icon={Download} className="shadow-md bg-indigo-600 hover:bg-indigo-700 border-none">Xuất báo cáo</Button>
        </div>
      </Flex>

      <div className="space-y-10">
        <section>
          <StatsCards />
        </section>
        
        <section className="space-y-6">
          <AttendanceCharts />
        </section>

        <section>
          <RecentAttendanceTable />
        </section>
      </div>
      
      <footer className="mt-20 py-10 border-t border-slate-200 dark:border-slate-800 text-center">
        <Text className="text-slate-400 text-sm italic">
          &copy; 2026 SmartAttendance System. Tất cả quyền được bảo lưu.
        </Text>
      </footer>
    </main>
  );
}
