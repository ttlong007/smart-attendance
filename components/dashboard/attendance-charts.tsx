import { useState, useEffect } from "react";
import { Card, Title, BarChart, AreaChart, Text, Flex, Badge, Icon } from "@tremor/react";
import { TrendingUp, BarChart3, Clock, Zap, Loader2 } from "lucide-react";

export function AttendanceCharts() {
  const [chartsData, setChartsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const res = await fetch("/api/admin/dashboard/charts");
        if (res.ok) {
          const data = await res.json();
          setChartsData(data.data);
        }
      } catch (err) {
        console.error("Fetch dashboard charts error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, []);

  const branchData = chartsData?.branchPerformance || [];
  const hourlyData = chartsData?.hourlyData || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6 sm:mt-10">
      <Card className="p-4 sm:p-8 bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl min-h-[450px] flex flex-col">
        <div className="flex justify-between items-start mb-6 sm:mb-10">
          <div className="flex gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1">
              <Title className="text-sm sm:text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Hiệu suất Chi nhánh</Title>
              <Text className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs font-semibold tracking-wider">Tỷ lệ check-in thực tế hôm nay</Text>
            </div>
          </div>
          <Badge color="indigo" className="hidden sm:inline-flex px-3 py-1 bg-indigo-50 text-indigo-600 border-none rounded-full font-bold text-[10px] uppercase tracking-widest animate-pulse">Top Giao dịch</Badge>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <BarChart
            className="h-64 sm:h-80 mt-6"
            data={branchData}
            index="name"
            categories={["Tỷ lệ check-in"]}
            colors={["indigo"]}
            valueFormatter={(number: number) => `${number}%`}
            yAxisWidth={48}
            showAnimation={true}
            showLegend={false}
            showTooltip={true}
            showGridLines={false}
          />
        )}
      </Card>

      <Card className="p-4 sm:p-8 bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl min-h-[450px] flex flex-col">
        <div className="flex justify-between items-start mb-6 sm:mb-10">
          <div className="flex gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1">
              <Title className="text-sm sm:text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Mật độ Cao điểm</Title>
              <Text className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs font-semibold tracking-wider">Phân tích lượt check-in theo giờ</Text>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Trực tiếp
          </div>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <AreaChart
            className="h-64 sm:h-80 mt-6"
            data={hourlyData}
            index="hour"
            categories={["Lượt check-in"]}
            colors={["emerald"]}
            valueFormatter={(number: number) => number.toLocaleString()}
            yAxisWidth={45}
            showAnimation={true}
            showGradient={true}
            curveType="monotone"
            showGridLines={false}
            showLegend={false}
            autoMinValue={true}
            noDataText="Đang cập nhật dữ liệu..."
          />
        )}
      </Card>
    </div>
  );
}
