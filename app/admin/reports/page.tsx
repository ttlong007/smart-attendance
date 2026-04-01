"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { 
  Download, 
  Calendar as CalendarIcon, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";
import {
  Card,
  Grid,
  Title,
  Text,
  Metric,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableBody,
  Badge,
  Flex,
  Button
} from "@tremor/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Branch {
  id: string;
  name: string;
  allowedPublicIp?: string | null;
}

interface ReportRecord {
  id: string;
  userName: string;
  userEmail: string;
  branchName: string;
  checkIn: string;
  checkOut: string | null;
  duration: string;
  durationMinutes: number;
  status: string;
  isVerified: boolean;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fromStr = date?.from ? format(date.from, "yyyy-MM-dd") : "";
      const toStr = date?.to ? format(date.to, "yyyy-MM-dd") : "";
      
      const [reportsRes, branchesRes] = await Promise.all([
        fetch(`/api/reports?startDate=${fromStr}&endDate=${toStr}&branchId=${branchFilter}&status=${statusFilter}`),
        fetch("/api/branches?pageSize=100"),
      ]);
      
      const reportsData = await reportsRes.json();
      const branchesData = await branchesRes.json();
      
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setBranches(Array.isArray(branchesData.branches) ? branchesData.branches : []);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  }, [date, branchFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportToCSV = () => {
    if (reports.length === 0) return;
    
    const headers = ["Nhân viên", "Email", "Chi nhánh", "Check In", "Check Out", "Thời lượng", "Trạng thái", "Xác thực"];
    const csvContent = [
      headers.join(","),
      ...reports.map(r => [
        `"${r.userName}"`,
        `"${r.userEmail}"`,
        `"${r.branchName}"`,
        `"${r.checkIn}"`,
        `"${r.checkOut || ""}"`,
        `"${r.duration}"`,
        `"${r.status}"`,
        `"${r.isVerified}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao-cao-cham-cong-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = {
    total: Array.isArray(reports) ? reports.length : 0,
    onTime: Array.isArray(reports) ? reports.filter(r => r.status === "ON_TIME").length : 0,
    late: Array.isArray(reports) ? reports.filter(r => r.status === "LATE").length : 0,
    absent: Array.isArray(reports) ? reports.filter(r => r.status === "ABSENT").length : 0,
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Báo cáo & Lịch sử</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Tổng hợp dữ liệu chấm công toàn hệ thống.</p>
        </div>
        <Button 
          icon={FileSpreadsheet} 
          onClick={exportToCSV}
          disabled={reports.length === 0}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none font-bold uppercase tracking-widest text-[10px] px-6 py-5 border-none"
        >
          Xuất Báo Cáo (CSV)
        </Button>
      </div>

      <Card className="p-4 sm:p-6 border-none shadow-sm bg-white dark:bg-slate-900">
        <div className="flex flex-wrap gap-4 items-stretch sm:items-center">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[280px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khoảng thời gian</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" className="w-full justify-start text-left font-normal bg-slate-50 dark:bg-slate-800 border-none">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <span className="text-xs sm:text-sm">
                        {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                      </span>
                    ) : (
                      format(date.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Chọn ngày</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  onSelect={(range) => setDate({ from: range?.from, to: range?.to })}
                  numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi nhánh</span>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-none">
                <SelectValue placeholder="Tất cả chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-none">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="ON_TIME">Đúng giờ</SelectItem>
                <SelectItem value="LATE">Đi trễ</SelectItem>
                <SelectItem value="ABSENT">Vắng mặt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <Card className="border-none shadow-sm" decoration="top" decorationColor="slate">
          <Text>Tổng cộng</Text>
          <Metric>{stats.total}</Metric>
        </Card>
        <Card className="border-none shadow-sm" decoration="top" decorationColor="emerald">
          <Text>Đúng giờ</Text>
          <Metric>{stats.onTime}</Metric>
        </Card>
        <Card className="border-none shadow-sm" decoration="top" decorationColor="amber">
          <Text>Đi trễ</Text>
          <Metric>{stats.late}</Metric>
        </Card>
        <Card className="border-none shadow-sm" decoration="top" decorationColor="rose">
          <Text>Vắng mặt</Text>
          <Metric>{stats.absent}</Metric>
        </Card>
      </Grid>

      {/* Desktop Table View */}
      <Card className="hidden md:block border-none shadow-sm p-6 overflow-hidden bg-white dark:bg-slate-900">
        <Table className="mt-5">
          <TableHead>
            <TableRow className="border-b border-slate-100 dark:border-slate-800">
              <TableHeaderCell className="text-xs uppercase font-black tracking-widest text-slate-400">Nhân viên</TableHeaderCell>
              <TableHeaderCell className="text-xs uppercase font-black tracking-widest text-slate-400">Chi nhánh</TableHeaderCell>
              <TableHeaderCell className="text-xs uppercase font-black tracking-widest text-slate-400 text-center">Check-in / Out</TableHeaderCell>
              <TableHeaderCell className="text-xs uppercase font-black tracking-widest text-slate-400">Thời lượng</TableHeaderCell>
              <TableHeaderCell className="text-xs uppercase font-black tracking-widest text-slate-400 text-right">Trạng thái</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">Đang tải dữ liệu báo cáo...</TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400 italic">Không có dữ liệu phù hợp với bộ lọc.</TableCell>
              </TableRow>
            ) : (
              reports.map((record) => (
                <TableRow key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <Text className="font-bold text-slate-900 dark:text-white">{record.userName}</Text>
                      <Text className="text-[10px] text-slate-400">{record.userEmail}</Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge color="zinc" className="font-medium">{record.branchName}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-bold">{format(new Date(record.checkIn), "HH:mm")}</span>
                        <span className="text-slate-300">-</span>
                        <span className="font-bold">{record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "--:--"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{format(new Date(record.checkIn), "dd/MM/yyyy")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">{record.duration}</Text>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      color={record.status === "ON_TIME" ? "emerald" : record.status === "LATE" ? "amber" : "rose"}
                      className="font-black text-[10px] uppercase tracking-tighter"
                    >
                      {record.status === "ON_TIME" ? "Đúng giờ" : record.status === "LATE" ? "Đi trễ" : "Vắng mặt"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 italic">Đang tải...</div>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center text-slate-400 italic">Không có dữ liệu.</div>
        ) : (
          reports.map((record) => (
            <div key={record.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{record.userName}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{record.userEmail}</p>
                </div>
                <Badge 
                  color={record.status === "ON_TIME" ? "emerald" : record.status === "LATE" ? "amber" : "rose"}
                  className="font-black text-[9px] uppercase tracking-tighter h-fit"
                >
                  {record.status === "ON_TIME" ? "Đúng giờ" : record.status === "LATE" ? "Đi trễ" : "Vắng mặt"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 dark:border-slate-800/60">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi nhánh</p>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{record.branchName}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời lượng</p>
                  <div className="flex items-center justify-end gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>{record.duration}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex justify-between items-center text-[11px]">
                 <div className="flex flex-col">
                   <span className="text-slate-400 font-bold uppercase text-[8px]">Check-in</span>
                   <span className="font-bold text-slate-700 dark:text-slate-200">{format(new Date(record.checkIn), "HH:mm")}</span>
                 </div>
                 <div className="flex flex-col text-center">
                   <span className="text-slate-300">→</span>
                 </div>
                 <div className="flex flex-col text-right">
                   <span className="text-slate-400 font-bold uppercase text-[8px]">Check-out</span>
                   <span className="font-bold text-slate-700 dark:text-slate-200">{record.checkOut ? format(new Date(record.checkOut), "HH:mm") : "--:--"}</span>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
