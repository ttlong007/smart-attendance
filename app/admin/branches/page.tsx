"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, MapPin, Wifi } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BranchDialog } from "@/components/admin/branch-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

interface Branch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  allowedWifiSsid: string;
  allowedWifiBssid: string;
  allowedPublicIp: string | null;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 1500);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const { toast } = useToast();

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/branches?page=${page}&search=${encodeURIComponent(debouncedSearch)}`,
      );
      const data = await response.json();
      setBranches(Array.isArray(data?.branches) ? data.branches : []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleCreate = () => {
    setSelectedBranch(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBranch) return;
    try {
      const response = await fetch(`/api/branches/${selectedBranch.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({ title: "Đã xóa chi nhánh" });
        fetchBranches();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi khi xóa" });
    } finally {
      setIsAlertOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Quản lý Chi nhánh
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Quản lý 100+ điểm giao dịch và vùng an toàn chấm công.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none font-bold uppercase tracking-widest text-[10px] sm:text-xs px-6 py-5"
        >
          <Plus className="mr-2 h-4 w-4" /> Thêm Chi nhánh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên hoặc địa chỉ..."
            className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-200 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Table View (Visible from lg breakpoint) */}
      <div className="hidden lg:block border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Tên Chi nhánh</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>GPS / Vùng an toàn</TableHead>
              <TableHead>WiFi Config</TableHead>
              <TableHead>Public IP</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : !branches || branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Không tìm thấy chi nhánh nào.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {branch.address}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="h-3 w-3" /> {branch.latitude},{" "}
                        {branch.longitude}
                      </div>
                      <Badge variant="outline" className="w-fit">
                        R: {branch.radius}m
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Wifi className="h-3 w-3" /> {branch.allowedWifiSsid}
                      </div>
                      <code className="text-[10px] text-slate-400 bg-slate-50 px-1 rounded">
                        {branch.allowedWifiBssid}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    {branch.allowedPublicIp ? (
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                      >
                        {branch.allowedPublicIp}
                      </Badge>
                    ) : (
                      <span className="text-slate-300 italic text-[10px]">
                        Không bắt buộc
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(branch)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeleteClick(branch)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View (Visible below lg breakpoint) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 italic">
            Đang tải...
          </div>
        ) : !branches || branches.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic">
            Không tìm thấy chi nhánh nào.
          </div>
        ) : (
          branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {branch.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {branch.address}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(branch)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(branch)}
                    className="h-8 w-8 text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 dark:border-slate-800/60">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Vùng an toàn
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <MapPin className="h-3 w-3 text-rose-500" />
                    <span>R: {branch.radius}m</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Mạng nội bộ
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Wifi className="h-3 w-3 text-indigo-500" />
                    <span className="truncate">{branch.allowedWifiSsid}</span>
                  </div>
                </div>
              </div>

              {branch.allowedPublicIp && (
                <div className="pt-2">
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                      Public IP
                    </span>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px] bg-white dark:bg-slate-900 shadow-sm border-none"
                    >
                      {branch.allowedPublicIp}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Trang {page} / {totalPages}
        </p>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      </div>

      <BranchDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        branch={selectedBranch}
        onSuccess={fetchBranches}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Dữ liệu chi nhánh và mọi lịch sử
              chấm công liên quan có thể bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Tiếp tục xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
