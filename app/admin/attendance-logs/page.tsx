"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  MapPin, 
  Globe, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Calendar as CalendarIcon,
  ChevronRight,
  MoreVertical,
  Building2
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

export default function AttendanceLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches?all=true");
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch (err) {
      console.error("Fetch branches error:", err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/attendance?branchId=${selectedBranch}`;
      if (date) {
        url += `&startDate=${startOfDay(date).toISOString()}&endDate=${endOfDay(date).toISOString()}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
      } else {
        toast.error("Không thể tải dữ liệu chấm công.");
      }
    } catch (err) {
      console.error("Fetch logs error:", err);
      toast.error("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedBranch, date]);

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Employee", "Check In", "Check Out", "IP", "Distance", "Status"];
    const rows = logs.map(log => [
      log.user.name,
      format(new Date(log.checkIn), "dd/MM/yyyy HH:mm"),
      log.checkOut ? format(new Date(log.checkOut), "dd/MM/yyyy HH:mm") : "N/A",
      log.ipAddress || "N/A",
      `${log.distance?.toFixed(1) || 0}m`,
      log.isVerified ? "Verified" : "Warning"
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_logs_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất báo cáo CSV thành công.");
  };

  return (
    <div className="container mx-auto p-8 space-y-8 max-w-[1600px]">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800">
               <History size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Lịch sử Chấm công</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Theo dõi và đối soát dữ liệu vào/ra của toàn hệ thống 5,000+ nhân viên.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={exportToCSV}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 h-12 flex items-center gap-2 shadow-lg shadow-violet-200 dark:shadow-none transition-all active:scale-[0.98]"
          >
            <Download size={18} />
            <span className="font-bold">Xuất Báo Cáo</span>
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
             <Building2 size={12} /> Chi nhánh
          </label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
              <SelectValue placeholder="Tất cả chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chi nhánh</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
             <CalendarIcon size={12} /> Thời gian
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 justify-start font-normal text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                <span className="font-bold text-slate-900 dark:text-slate-200 mr-2">
                  {date && format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "Hôm nay:" : "Ngày:"}
                </span> 
                {date ? format(date, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-[1.5rem] border-slate-200 shadow-2xl" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="p-3"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="relative flex-[2] min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên nhân viên hoặc mã số..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 focus:outline-none focus:ring-2 ring-indigo-500/20 text-sm font-medium"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-6 px-6 font-bold text-slate-900 dark:text-slate-200">Nhân viên</TableHead>
              <TableHead className="font-bold text-slate-900 dark:text-slate-200">Thời gian</TableHead>
              <TableHead className="font-bold text-slate-900 dark:text-slate-200">Xác thực mạng</TableHead>
              <TableHead className="font-bold text-slate-900 dark:text-slate-200">Vị trí</TableHead>
              <TableHead className="font-bold text-slate-900 dark:text-slate-200 text-center">Minh chứng</TableHead>
              <TableHead className="font-bold text-slate-900 dark:text-slate-200">Trạng thái</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="p-0">
                    <div className="h-20 w-full animate-pulse bg-slate-50/50 dark:bg-slate-800/20" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-32 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                       <Search size={40} className="opacity-20" />
                    </div>
                    <p className="font-bold text-lg">Không tìm thấy dữ liệu chấm công</p>
                    <p className="text-sm">Thử thay đổi bộ lọc hoặc chọn chi nhánh khác.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs
                .filter(log => 
                  log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  (log.user.employeeId && log.user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((log) => {
                const isIpMatch = log.ipAddress === log.branch.allowedPublicIp || (log.ipAddress === "::1" || log.ipAddress === "127.0.0.1");
                const isDistanceOk = log.distance <= 100;

                return (
                  <TableRow key={log.id} className="group transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-50 dark:border-slate-800">
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 p-1">
                          <div className="w-full h-full rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700">
                            {log.user.image ? (
                              <img src={log.user.image} alt={log.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-indigo-600 blur-none">{log.user.name.charAt(0)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {log.user.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {log.user.employeeId || "NV-2026-007"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                          <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 rounded-lg text-xs py-0.5">VÀO</span>
                          {format(new Date(log.checkIn), "HH:mm")}
                        </div>
                        <div className="flex items-center gap-2 font-bold text-slate-500 mt-1">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 rounded-lg text-xs py-0.5">RA</span>
                          {log.checkOut ? format(new Date(log.checkOut), "HH:mm") : "--:--"}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1.5 min-w-[140px]">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <Globe size={12} /> {log.ipAddress || "42.114.xxx.173"}
                        </div>
                        {isIpMatch ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 rounded-lg px-2 py-0.5">
                            Mạng Nội Bộ
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 rounded-lg px-2 py-0.5">
                            Mạng Lạ
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1.5 min-w-[120px]">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <MapPin size={12} /> {log.branch.name}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-slate-900 dark:text-white">{log.distance?.toFixed(0) || 0}m</span>
                           {!isDistanceOk && (
                             <Badge className="bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 rounded-lg px-2 py-0.5">
                               Ngoài vùng
                             </Badge>
                           )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden hover:ring-2 ring-indigo-500/50 transition-all">
                              {log.photo ? (
                                <img src={log.photo} alt="Check-in" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={14} className="mx-auto text-slate-400" />
                              )}
                              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye size={12} className="text-white" />
                              </div>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md rounded-[2.5rem]">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-black">Minh chứng vào ca</DialogTitle>
                            </DialogHeader>
                            <div className="aspect-[3/4] w-full rounded-[2rem] overflow-hidden border-4 border-slate-100">
                              <img src={log.photo} className="w-full h-full object-cover" />
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden hover:ring-2 ring-indigo-500/50 transition-all opacity-80 hover:opacity-100">
                              {log.photoOut ? (
                                <img src={log.photoOut} alt="Check-out" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={14} className="mx-auto text-slate-400" />
                              )}
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md rounded-[2.5rem]">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-black">Minh chứng tan ca</DialogTitle>
                            </DialogHeader>
                            <div className="aspect-[3/4] w-full rounded-[2rem] overflow-hidden border-4 border-slate-100 bg-slate-50 flex items-center justify-center">
                              {log.photoOut ? (
                                <img src={log.photoOut} className="w-full h-full object-cover" />
                              ) : (
                                <p className="text-slate-400 font-bold">Chưa có ảnh tan ca</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>

                    <TableCell>
                      {log.isVerified ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 rounded-full px-4 py-1.5 font-bold">
                          <CheckCircle2 size={12} className="mr-1.5" />
                          Hợp lệ
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800 rounded-full px-4 py-1.5 font-bold animate-pulse">
                          <AlertCircle size={12} className="mr-1.5" />
                          Cần kiểm tra
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <MoreVertical size={20} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
