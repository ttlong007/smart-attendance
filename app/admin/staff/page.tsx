"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Filter, UserCircle2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StaffDialog } from "@/components/admin/staff-dialog";
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
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface Branch {
  id: string;
  name: string;
  address: string;
  allowedPublicIp?: string | null;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  branchId: string | null;
  branch: Branch | null;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const debouncedSearch = useDebounce(search, 1500);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Main data fetch effect
  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const branchParam = branchFilter !== "all" ? `&branchId=${branchFilter}` : "";
        const url = `/api/staff?page=${page}&search=${encodeURIComponent(debouncedSearch)}${branchParam}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (res.ok) {
          setStaff(Array.isArray(data?.staff) ? data.staff : []);
          setTotalPages(data?.pagination?.totalPages ?? 1);
        } else {
          toast.error("Không thể tải danh sách nhân viên");
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast.error("Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [page, debouncedSearch, branchFilter, refreshKey]);

  // Initial branch fetch
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches?pageSize=100");
        const data = await res.json();
        if (res.ok) {
          setBranches(Array.isArray(data?.branches) ? data.branches : []);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    fetchBranches();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, branchFilter]);

  const handleCreate = () => {
    setSelectedStaff(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: Staff) => {
    setSelectedStaff(user);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (user: Staff) => {
    setSelectedStaff(user);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStaff) return;
    try {
      const response = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Đã xóa nhân viên");
        refresh();
      }
    } catch (error) {
      toast.error("Lỗi khi xóa");
    } finally {
      setIsAlertOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản lý Nhân viên</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Quản lý 5,000+ nhân viên và phân quyền hệ thống.</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none font-bold uppercase tracking-widest text-[10px] sm:text-xs px-6 py-5">
          <Plus className="mr-2 h-4 w-4" /> Thêm Nhân viên
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Filter className="h-4 w-4 text-muted-foreground" />
           <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
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
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Chi nhánh trực thuộc</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Đang tải...</TableCell>
              </TableRow>
            ) : (!staff || staff.length === 0) ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Không tìm thấy nhân viên nào.</TableCell>
              </TableRow>
            ) : (
              staff.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <UserCircle2 className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : user.role === "MANAGER" ? "secondary" : "outline"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.branch ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.branch.name}</span>
                        <span className="text-[10px] text-muted-foreground">{user.branch.address}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-sm">Chưa gán</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteClick(user)}>
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

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 italic">Đang tải...</div>
        ) : (!staff || staff.length === 0) ? (
          <div className="p-8 text-center text-slate-500 italic">Không tìm thấy nhân viên nào.</div>
        ) : (
          staff.map((user) => (
            <div key={user.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <UserCircle2 className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{user.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)} className="h-8 w-8 text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 dark:border-slate-800/60">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vai trò</p>
                  <Badge variant={user.role === "ADMIN" ? "default" : user.role === "MANAGER" ? "secondary" : "outline"} className="text-[10px] px-2 py-0">
                    {user.role}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi nhánh</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                    {user.branch?.name || "Chưa gán"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Trang {page} / {totalPages}</p>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Trước</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Sau</Button>
        </div>
      </div>

      <StaffDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        staff={selectedStaff}
        branches={branches}
        onSuccess={refresh}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Nhân viên sẽ mất quyền truy cập vào hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-600 hover:bg-rose-700">Tiếp tục xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
