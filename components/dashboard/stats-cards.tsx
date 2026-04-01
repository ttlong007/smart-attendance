import { useState, useEffect } from "react";
import { Card, Metric, Text, Flex, Badge, Icon, Grid } from "@tremor/react";
import { Users, Building2, Timer, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

export function StatsCards() {
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStatsData(data.data);
        }
      } catch (err) {
        console.error("Fetch dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    {
      title: "Tổng Nhân viên",
      metric: statsData?.totalEmployees.value || "5.000+",
      icon: Users,
      color: "blue",
      trend: statsData?.totalEmployees.trend || "+24 trong tháng",
      trendColor: "emerald" as any,
    },
    {
      title: "Tổng Chi nhánh",
      metric: statsData?.totalBranches.value || "100",
      icon: Building2,
      color: "indigo",
      trend: statsData?.totalBranches.trend || "Toàn quốc",
      trendColor: "slate" as any,
    },
    {
      title: "Đúng giờ (Hôm nay)",
      metric: statsData?.onTimeRate.value || "94.8%",
      icon: Timer,
      color: "emerald",
      trend: statsData?.onTimeRate.trend || "+1.2% so với hôm qua",
      trendColor: statsData?.onTimeRate.isPositive ? "emerald" : "rose" as any,
    },
    {
      title: "Vi phạm / Gian lận",
      metric: statsData?.violations.value ?? "12",
      icon: AlertCircle,
      color: "rose",
      trend: statsData?.violations.trend || "Cần xử lý ngay",
      trendColor: statsData?.violations.isCritical ? "rose" : "slate" as any,
    },
  ];

  if (loading && !statsData) {
    return (
      <div className="flex items-center justify-center h-48 py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Grid numItemsSm={2} numItemsLg={4} className="gap-4 md:gap-8">
      {stats.map((item) => (
        <Card 
          key={item.title} 
          className="p-4 sm:p-8 bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-800/30 rounded-bl-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
          
          <Flex justifyContent="between" alignItems="start" className="relative z-10">
            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-${item.color}-50 dark:bg-${item.color}-900/30 text-${item.color}-600 dark:text-${item.color}-400 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="flex flex-col items-end">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
               <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live</Text>
            </div>
          </Flex>
          
          <div className="mt-4 sm:mt-8 relative z-10">
            <Text className="text-slate-500 dark:text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em]">{item.title}</Text>
            <Metric className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1 tracking-tighter">{item.metric}</Metric>
          </div>
          
          <Flex justifyContent="start" className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-50 dark:border-slate-800 gap-2 relative z-10">
            <Badge color={item.trendColor} className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">{item.trend}</Badge>
          </Flex>
        </Card>
      ))}
    </Grid>
  );
}
