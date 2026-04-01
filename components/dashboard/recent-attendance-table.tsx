"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Card,
  Title,
  Text,
  Badge,
  Flex,
  Button,
} from "@tremor/react";
import { 
  UserCheck, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export function RecentAttendanceTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestLogs = async () => {
      try {
        const res = await fetch("/api/admin/attendance/latest");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.data || []);
        }
      } catch (err) {
        console.error("Fetch latest logs error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestLogs();
  }, []);

  return (
    <Card className="p-4 sm:p-10 bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-200/40 dark:shadow-none mt-6 sm:mt-10 transition-all duration-500 overflow-hidden">
      <Flex justifyContent="between" alignItems="center" className="mb-6 sm:mb-10">
        <div className="flex gap-3 sm:gap-4 items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
                <Title className="text-sm sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Bản ghi chấm công mới nhất</Title>
                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold tracking-wider">Theo dõi lưu lượng check-in thời gian thực</Text>
            </div>
        </div>
        <Link href="/admin/attendance-logs">
          <Button variant="light" icon={ExternalLink} className="hidden sm:flex text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Xem tất cả</Button>
        </Link>
      </Flex>

      <div className="border border-slate-50 dark:border-slate-800/60 rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <Text className="font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu thực tế...</Text>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-slate-400">
            <Text className="font-bold italic uppercase tracking-widest opacity-50">Chưa có dữ liệu chấm công nào</Text>
          </div>
        ) : (
          <Table className="bg-transparent">
            <TableHead className="bg-slate-50/50 dark:bg-slate-800/30">
              <TableRow>
                <TableHeaderCell className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-5 pl-4 sm:pl-8">Nhân viên</TableHeaderCell>
                <TableHeaderCell className="hidden sm:table-cell text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">Chi nhánh</TableHeaderCell>
                <TableHeaderCell className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-5 text-center">Thời gian</TableHeaderCell>
                <TableHeaderCell className="hidden lg:table-cell text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">Vị trí (GPS)</TableHeaderCell>
                <TableHeaderCell className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-5 pr-4 sm:pr-8 text-right">Xác thực</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-50 dark:border-slate-800/40 last:border-none">
                  <TableCell className="py-4 sm:py-6 pl-4 sm:pl-8">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-500 font-black text-[10px] sm:text-xs overflow-hidden">
                          {item.user.image ? (
                            <img src={item.user.image} alt={item.user.name} className="w-full h-full object-cover" />
                          ) : (
                            item.user.name.split(" ").map((n: string) => n[0]).join("").slice(-2).toUpperCase()
                          )}
                      </div>
                      <div>
                        <Text className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-base">{item.user.name}</Text>
                        <Text className="sm:hidden text-[10px] text-slate-400 font-medium">{item.branch.name}</Text>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge color="zinc" className="rounded-md font-bold text-[10px] border-none bg-slate-100/50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase tracking-tighter px-2">
                      {item.branch.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <Text className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                        {format(new Date(item.checkIn), "HH:mm")}
                      </Text>
                      <Text className="hidden sm:block text-[10px] text-slate-400 font-medium">
                        {format(new Date(item.checkIn), "dd/MM/yyyy")}
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span className="text-[10px] font-bold tracking-tight truncate max-w-[200px]">
                        GPS ({item.lat.toFixed(4)}, {item.lng.toFixed(4)})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 sm:pr-8 text-right">
                    <Badge 
                      color={item.isVerified ? "emerald" : "amber"} 
                      className="font-black text-[8px] sm:text-[9px] uppercase tracking-widest px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full"
                    >
                      {item.isVerified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Flex justifyContent="between" alignItems="center" className="mt-8 sm:mt-10 px-0 sm:px-2 flex-col sm:flex-row gap-4">
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hiển thị {logs.length} trên 1.250 bản ghi</Text>
        <div className="flex gap-1.5 sm:gap-2">
            <Button size="xs" variant="secondary" icon={ChevronLeft} className="rounded-lg h-8 sm:h-auto">Trước</Button>
            <div className="flex gap-1 items-center px-1 sm:px-4">
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-md">1</span>
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-black cursor-pointer transition-colors">2</span>
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-black cursor-pointer transition-colors">3</span>
            </div>
            <Button size="xs" variant="secondary" icon={ChevronRight} iconPosition="right" className="rounded-lg h-8 sm:h-auto">Tiếp</Button>
        </div>
      </Flex>
    </Card>
  );
}
