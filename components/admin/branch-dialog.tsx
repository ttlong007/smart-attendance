"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

const ipv4Regex = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;
const ipv6Regex = /^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$/;

const formSchema = z.object({
  name: z.string().min(2, { message: "Tên chi nhánh ít nhất 2 ký tự." }),
  address: z.string().min(5, { message: "Địa chỉ ít nhất 5 ký tự." }),
  latitude: z.string().refine((val) => !isNaN(parseFloat(val)), { message: "Vĩ độ không hợp lệ." }),
  longitude: z.string().refine((val) => !isNaN(parseFloat(val)), { message: "Kinh độ không hợp lệ." }),
  radius: z.string().refine((val) => !isNaN(parseInt(val)), { message: "Bán kính không hợp lệ." }),
  allowedWifiSsid: z.string().min(1, { message: "SSID không được để trống." }),
  allowedWifiBssid: z.string().min(1, { message: "BSSID không được để trống." }),
  allowedPublicIp: z.string().optional().or(z.literal("")).refine((val) => {
    if (!val) return true;
    return ipv4Regex.test(val) || ipv6Regex.test(val);
  }, { message: "Định dạng IP không hợp lệ (hỗ trợ IPv4/IPv6)." }),
});

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: any;
  onSuccess: () => void;
}

export function BranchDialog({ open, onOpenChange, branch, onSuccess }: BranchDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingIp, setFetchingIp] = useState(false);
  const { toast } = useToast();

  const fetchMyIp = async () => {
    setFetchingIp(true);
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      if (data.ip) {
        form.setValue("allowedPublicIp", data.ip);
        toast({ title: "Đã lấy IP thành công", description: `Địa chỉ IP: ${data.ip}` });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể lấy IP hiện tại của bạn." });
    } finally {
      setFetchingIp(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      radius: "100",
      allowedWifiSsid: "",
      allowedWifiBssid: "",
      allowedPublicIp: "",
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name,
        address: branch.address,
        latitude: branch.latitude.toString(),
        longitude: branch.longitude.toString(),
        radius: branch.radius.toString(),
        allowedWifiSsid: branch.allowedWifiSsid,
        allowedWifiBssid: branch.allowedWifiBssid,
        allowedPublicIp: branch.allowedPublicIp || "",
      });
    } else {
      form.reset({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        radius: "100",
        allowedWifiSsid: "",
        allowedWifiBssid: "",
        allowedPublicIp: "",
      });
    }
  }, [branch, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const url = branch ? `/api/branches/${branch.id}` : "/api/branches";
      const method = branch ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to save branch");

      toast({
        title: branch ? "Cập nhật thành công" : "Tạo mới thành công",
        description: `Chi nhánh ${values.name} đã được lưu.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu thông tin chi nhánh.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{branch ? "Sửa Chi Nhánh" : "Thêm Chi Nhánh"}</DialogTitle>
          <DialogDescription>
            Cấu hình thông tin chi nhánh và vùng an toàn chấm công.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên Chi Nhánh</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Chi nhánh Hòa Bình" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Số 123, Đường A, Quận B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vĩ độ (Lat)</FormLabel>
                    <FormControl>
                      <Input placeholder="21.0285" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kinh độ (Lng)</FormLabel>
                    <FormControl>
                      <Input placeholder="105.8542" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="radius"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bán kính cho phép (m)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="allowedWifiSsid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SSID</FormLabel>
                    <FormControl>
                      <Input placeholder="HDBank_Branch_WiFi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allowedWifiBssid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BSSID</FormLabel>
                    <FormControl>
                      <Input placeholder="00:11:22:33:44:55" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="allowedPublicIp"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Địa chỉ IP tĩnh (Public IP)</FormLabel>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={fetchMyIp}
                      disabled={fetchingIp}
                      className="h-8 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold uppercase tracking-tight"
                    >
                      {fetchingIp ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
                      Lấy IP hiện tại của tôi
                    </Button>
                  </div>
                  <FormControl>
                    <Input placeholder="VD: 14.232.245.168 (Bỏ trống nếu không bắt buộc)" {...field} />
                  </FormControl>
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
