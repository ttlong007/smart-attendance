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
    const ips = val.split(',').map(ip => ip.trim()).filter(ip => ip !== "");
    return ips.every(ip => ipv4Regex.test(ip) || ipv6Regex.test(ip));
  }, { message: "Định dạng IP không hợp lệ (Hỗ trợ danh sách IPv4/IPv6 ngăn cách bởi dấu phẩy)." }),
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
    const discoveredIps = new Set<string>();
    
    try {
      // Source 1: Our OWN server perspective
      const res1 = await fetch("/api/admin/my-ip").then(r => r.json()).catch(() => null);
      if (res1?.ip) discoveredIps.add(res1.ip);

      // Source 2: GUARANTEED IPv6 (api6.ipify.org only returns IPv6 if available)
      const res2 = await fetch("https://api6.ipify.org?format=json").then(r => r.json()).catch(() => null);
      if (res2?.ip) discoveredIps.add(res2.ip);

      // Source 3: IPv6/IPv4 universal
      const res3 = await fetch("https://api64.ipify.org?format=json").then(r => r.json()).catch(() => null);
      if (res3?.ip) discoveredIps.add(res3.ip);

      // Source 4: Forced IPv4
      const res4 = await fetch("https://api.ipify.org?format=json").then(r => r.json()).catch(() => null);
      if (res4?.ip) discoveredIps.add(res4.ip);

      const finalIps = Array.from(discoveredIps);
      
      if (finalIps.length > 0) {
        form.setValue("allowedPublicIp", finalIps.join(", "));
        toast({ 
          title: "Đã cập nhật danh sách IP", 
          description: `Phát hiện ${finalIps.length} địa chỉ: ${finalIps.join(", ")}` 
        });
      } else {
        throw new Error("No IP found");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể tự động lấy IP. Vui lòng điền thủ công." });
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
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none rounded-[2.5rem] bg-white shadow-2xl">
        <div className="max-h-[90vh] overflow-y-auto p-8">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {branch ? "Sửa Chi Nhánh" : "Thêm Chi Nhánh Mới"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Cấu hình thông tin chi nhánh và vùng an toàn chấm công.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên Chi Nhánh</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Chi nhánh Hòa Bình" {...field} className="h-12 bg-slate-50 border-transparent rounded-xl focus:ring-indigo-500/10 focus:border-indigo-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Số 123, Đường A, Quận B" {...field} className="h-12 bg-slate-50 border-transparent rounded-xl focus:ring-indigo-500/10 focus:border-indigo-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vĩ độ (Lat)</FormLabel>
                      <FormControl>
                        <Input placeholder="21.0285" {...field} className="h-12 bg-slate-50 border-transparent rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kinh độ (Lng)</FormLabel>
                      <FormControl>
                        <Input placeholder="105.8542" {...field} className="h-12 bg-slate-50 border-transparent rounded-xl" />
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
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bán kính cho phép (m)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="h-12 bg-slate-50 border-transparent rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="allowedWifiSsid"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SSID WiFi (Tên WiFi)</FormLabel>
                      <FormControl>
                        <Input placeholder="HDBank_Branch_WiFi" {...field} className="h-12 bg-slate-50 border-transparent rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowedWifiBssid"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">BSSID WiFi (MAC Addr)</FormLabel>
                      <FormControl>
                        <Input placeholder="00:11:22:33:44:55" {...field} className="h-12 bg-slate-50 border-transparent rounded-xl" />
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
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ IP tĩnh (Public IP)</FormLabel>
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
                      <Input placeholder="VD: 14.232.245.168 (Bỏ trống nếu không bắt buộc)" {...field} className="h-12 bg-slate-50 border-transparent rounded-xl font-mono text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 mt-4 transition-all active:scale-[0.98]">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
