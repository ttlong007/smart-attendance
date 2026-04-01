"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, { message: "Tên ít nhất 2 ký tự." }),
  email: z.string().email({ message: "Email không hợp lệ." }),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
  branchId: z.string().optional(),
});

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: any;
  branches: any[];
  onSuccess: () => void;
}

export function StaffDialog({ open, onOpenChange, staff, branches, onSuccess }: StaffDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "STAFF",
      branchId: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (staff) {
        form.reset({
          name: staff.name,
          email: staff.email,
          role: staff.role,
          branchId: staff.branchId || "none",
        });
      } else {
        form.reset({
          name: "",
          email: "",
          role: "STAFF",
          branchId: "none",
        });
      }
    }
  }, [open, staff, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const url = staff ? `/api/staff/${staff.id}` : "/api/staff";
      const method = staff ? "PATCH" : "POST";

      const payload = {
        ...values,
        branchId: values.branchId === "none" ? null : values.branchId,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save staff");

      toast.success(staff ? "Cập nhật thành công" : "Tạo mới thành công", {
        description: `Nhân viên ${values.name} đã được lưu.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Lỗi", {
        description: "Không thể lưu thông tin nhân viên.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{staff ? "Sửa Nhân Viên" : "Thêm Nhân Viên"}</DialogTitle>
          <DialogDescription>
            Quản lý thông tin cá nhân và phân quyền cho nhân viên.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@hdbank.com.vn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vai trò</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Chi nhánh</FormLabel>
                  <BranchSelector
                    branches={branches}
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none font-bold uppercase tracking-widest text-xs py-5">
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BranchSelector({ branches, value, onChange }: { branches: any[], value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = branches.filter((b) => {
    if (!search) return true;
    const normalize = (str: string) =>
      (str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
    
    return normalize(b.name).includes(normalize(search));
  });

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) setSearch("");
    }}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground"
            )}
          >
            {value === "none" || !value
              ? "Chọn chi nhánh"
              : branches.find((b) => b.id === value)?.name || "Chọn chi nhánh"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex flex-col">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Tìm tên chi nhánh..."
              className="h-8 w-full border-none bg-transparent p-0 focus-visible:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onInput={(e) => setSearch(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === ' ') e.stopPropagation();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            <div
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                value === "none" && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                onChange("none");
                setOpen(false);
              }}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {value === "none" && <Check className="h-4 w-4" />}
              </span>
              Không xác định
            </div>
            {filtered.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  value === b.id && "bg-accent text-accent-foreground"
                )}
                onClick={() => {
                  onChange(b.id);
                  setOpen(false);
                }}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  {value === b.id && <Check className="h-4 w-4" />}
                </span>
                {b.name}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy chi nhánh nào.
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
