"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1 + "");
  const [year, setYear] = useState(new Date().getFullYear() + "");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/attendance/my-history?month=${month}&year=${year}`,
      );
      if (res.ok) {
        const data = await res.json();
        setHistory(data.data);
      } else {
        toast.error("Không thể tải lịch sử chấm công.");
      }
    } catch (err) {
      console.error("Fetch history error:", err);
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [month, year]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    label: `Tháng ${i + 1}`,
    value: (i + 1).toString(),
  }));

  const years = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { label: y.toString(), value: y.toString() };
  });

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Lịch sử chấm công
        </h1>
        <p className="text-slate-500 text-sm">
          Xem lại các lượt vào/ra ca của bạn theo tháng.
        </p>
      </header>

      <Card className="border-none shadow-sm bg-slate-50/50">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">
              Chọn tháng
            </label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="bg-white rounded-xl border-slate-200">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">
              Chọn năm
            </label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="bg-white rounded-xl border-slate-200">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.value} value={y.value}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge
            variant="outline"
            className="h-10 px-4 rounded-xl border-slate-200 bg-white text-slate-500"
          >
            Tổng cộng: {history.length} lượt
          </Badge>
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold text-slate-900 py-4">
                Ngày
              </TableHead>
              <TableHead className="font-bold text-slate-900">Vào ca</TableHead>
              <TableHead className="font-bold text-slate-900">Tan ca</TableHead>
              <TableHead className="font-bold text-slate-900">
                Tổng giờ
              </TableHead>
              <TableHead className="font-bold text-slate-900">
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-10 w-10 bg-slate-100 animate-pulse rounded-full" />
                  </TableCell>
                  <TableCell>
                    <div className="h-10 w-10 bg-slate-100 animate-pulse rounded-full" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-12 bg-slate-100 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-20 bg-slate-100 animate-pulse rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Search size={40} className="opacity-20" />
                    <p>Không có dữ liệu chấm công cho thời gian này.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              history.map((record) => (
                <TableRow
                  key={record.id}
                  className={`group transition-colors ${!record.isVerified ? "bg-rose-50/50 hover:bg-rose-100/50" : "hover:bg-slate-50"}`}
                >
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">
                        {format(new Date(record.checkIn), "dd/MM/yyyy")}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-medium">
                        {format(new Date(record.checkIn), "EEEE", {
                          locale: vi,
                        })}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50 flex items-center justify-center">
                        {record.photo ? (
                          <img
                            src={record.photo}
                            alt="Check-in"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <ImageIcon size={16} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">
                          {format(new Date(record.checkIn), "HH:mm")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Vào ca
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50 flex items-center justify-center">
                        {record.photoOut ? (
                          <img
                            src={record.photoOut}
                            alt="Check-out"
                            className="object-cover w-full h-full"
                          />
                        ) : record.checkOut ? (
                          <ImageIcon size={16} className="text-slate-300" />
                        ) : (
                          <Clock size={16} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">
                          {record.checkOut
                            ? format(new Date(record.checkOut), "HH:mm")
                            : "--:--"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Tan ca
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <Clock size={14} className="text-slate-300" />
                      {record.totalHours ? record.totalHours.toFixed(1) : "0"}h
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {record.isVerified ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 rounded-lg py-1">
                          <CheckCircle2 size={12} className="mr-1" />
                          Hợp lệ
                        </Badge>
                      ) : (
                        <div className="relative group/note">
                          <Badge
                            variant="destructive"
                            className="bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 rounded-lg py-1 cursor-help"
                          >
                            <AlertCircle size={12} className="mr-1" />
                            Nghi ngờ
                          </Badge>
                          {record.verificationNote && (
                            <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/note:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl border border-slate-700">
                              {record.verificationNote}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
