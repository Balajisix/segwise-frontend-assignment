import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CreativeRow } from "../pages/Home";
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  AreaChart as AreaChartIcon, 
  LayoutGrid,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// This is the chart config with separate colors
const chartConfig = {
  spends: {
    label: "Spend",
    color: "#8b5cf6",
  },
  impressions: {
    label: "Impressions",
    color: "#3b82f6", 
  },
  clicks: {
    label: "Clicks",
    color: "#10b981",
  },
  installs: {
    label: "Installs",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

interface ChartViewProps {
  data: CreativeRow[];
  viewMode: "summary" | "trend";
}

const ChartView: React.FC<ChartViewProps> = ({ data, viewMode: initialViewMode }) => {
  const [viewMode, setViewMode] = useState<"summary" | "trend">(initialViewMode); void(setViewMode)
  const [chartType, setChartType] = useState<"bar" | "line" | "area" | "composed">(
    viewMode === "summary" ? "bar" : "line"
  );
  const [activeMetrics, setActiveMetrics] = useState<string[]>(
    ["spends", "impressions", "clicks", "installs"]
  );

  // Format numbers for display
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  // Transform data with useMemo for optimization
  const chartData = useMemo(() => {
    return data.map((row) => ({
      name: String(row.creative_name || row.campaign || ""),
      spends: Number(row.spend) || 0,
      impressions: Number(row.impressions) || 0,
      clicks: Number(row.clicks) || 0,
      installs: Number(row.installs) || 0,
      // Calculate CTR and conversion rates for insights
      ctr: row.impressions ? ((Number(row.clicks) / Number(row.impressions)) * 100).toFixed(2) : "0",
      cvr: row.clicks ? ((Number(row.installs) / Number(row.clicks)) * 100).toFixed(2) : "0",
    }));
  }, [data]);

  // Calculate totals and averages
  const metrics = useMemo(() => {
    const totals = chartData.reduce(
      (acc, item) => ({
        spends: acc.spends + item.spends,
        impressions: acc.impressions + item.impressions,
        clicks: acc.clicks + item.clicks,
        installs: acc.installs + item.installs,
      }),
      { spends: 0, impressions: 0, clicks: 0, installs: 0 }
    );

    const ctr = totals.impressions ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0";
    const cvr = totals.clicks ? ((totals.installs / totals.clicks) * 100).toFixed(2) : "0";
    
    return { totals, ctr, cvr };
  }, [chartData]);

  // Handles download chart as SVG
  const handleDownload = () => {
    const svgElement = document.querySelector(".recharts-wrapper svg");
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `chart-${viewMode}-${new Date().toISOString().slice(0, 10)}.svg`;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  };

  // Toggle metrics selection
  const toggleMetric = (value: string) => {
    setActiveMetrics(prev => {
      if (prev.includes(value)) {
        // Keep one metric active by default
        return prev.length > 1 ? prev.filter(m => m !== value) : prev;
      } else {
        return [...prev, value];
      }
    });
  };

  // Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-md shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <div className="mt-2 space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{entry.name}:</span>
                <span className="font-medium">{
                  entry.name.toLowerCase().includes('rate') 
                    ? `${entry.value}%` 
                    : formatNumber(entry.value)
                }</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Legend component
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {payload.map((entry: any, index: number) => (
          <div 
            key={index} 
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => toggleMetric(entry.dataKey)}
          >
            <div 
              className={`w-3 h-3 rounded-full ${!activeMetrics.includes(entry.dataKey) ? 'opacity-30' : ''}`} 
              style={{ backgroundColor: entry.color }}
            />
            <span className={`text-sm ${!activeMetrics.includes(entry.dataKey) ? 'text-gray-400' : 'text-gray-700'}`}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full shadow-lg border-t-4 border-t-blue-500">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <CardTitle className="text-xl">Performance Analytics</CardTitle>
            <CardDescription className="text-gray-500">
              Visualizing campaign metrics across {chartData.length} creatives
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <ToggleGroup type="single" value={chartType} onValueChange={(val) => val && setChartType(val as any)}>
              <ToggleGroupItem value="bar" aria-label="Bar Chart">
                <BarChart3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="line" aria-label="Line Chart">
                <LineChartIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="area" aria-label="Area Chart">
                <AreaChartIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="composed" aria-label="Composed Chart">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Badge variant="outline" className="w-full flex flex-col sm:flex-row justify-between p-3">
            <span className="text-xs sm:text-sm break-words">Total Spend</span>
            <span className="mt-1 sm:mt-0 text-lg font-bold whitespace-nowrap">
              ${formatNumber(metrics.totals.spends)}
            </span>
          </Badge>
          <Badge variant="outline" className="w-full flex flex-col sm:flex-row justify-between p-3">
            <span className="text-xs sm:text-sm break-words">Impressions</span>
            <span className="mt-1 sm:mt-0 text-lg font-bold whitespace-nowrap">
              {formatNumber(metrics.totals.impressions)}
            </span>
          </Badge>
          <Badge variant="outline" className="w-full flex flex-col sm:flex-row justify-between p-3">
            <span className="text-xs sm:text-sm break-words">CTR</span>
            <span className="mt-1 sm:mt-0 text-lg font-bold whitespace-nowrap">
              {metrics.ctr}%
            </span>
          </Badge>
          <Badge variant="outline" className="w-full flex flex-col sm:flex-row justify-between p-3">
            <span className="text-xs sm:text-sm break-words">CVR</span>
            <span className="mt-1 sm:mt-0 text-lg font-bold whitespace-nowrap">
              {metrics.cvr}%
            </span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <div className="w-full h-80">

            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  barGap={10}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    stroke={chartConfig.spends.color}
                    tickFormatter={formatNumber}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={chartConfig.impressions.color}
                    tickFormatter={formatNumber}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                  {activeMetrics.includes('spends') && (
                    <Bar
                      yAxisId="left"
                      dataKey="spends"
                      name="Spend ($)"
                      fill={chartConfig.spends.color}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    />
                  )}
                  {activeMetrics.includes('impressions') && (
                    <Bar
                      yAxisId="right"
                      dataKey="impressions"
                      name="Impressions"
                      fill={chartConfig.impressions.color}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1200}
                    />
                  )}
                  {activeMetrics.includes('clicks') && (
                    <Bar
                      yAxisId="left"
                      dataKey="clicks"
                      name="Clicks"
                      fill={chartConfig.clicks.color}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1400}
                    />
                  )}
                  {activeMetrics.includes('installs') && (
                    <Bar
                      yAxisId="left"
                      dataKey="installs"
                      name="Installs"
                      fill={chartConfig.installs.color}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1600}
                    />
                  )}
                </BarChart>
              ) : chartType === "line" ? (
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                  {activeMetrics.includes('spends') && (
                    <Line
                      type="monotone"
                      dataKey="spends"
                      name="Spend ($)"
                      stroke={chartConfig.spends.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1000}
                    />
                  )}
                  {activeMetrics.includes('impressions') && (
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke={chartConfig.impressions.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1200}
                    />
                  )}
                  {activeMetrics.includes('clicks') && (
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke={chartConfig.clicks.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1400}
                    />
                  )}
                  {activeMetrics.includes('installs') && (
                    <Line
                      type="monotone"
                      dataKey="installs"
                      name="Installs"
                      stroke={chartConfig.installs.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1600}
                    />
                  )}
                </LineChart>
              ) : chartType === "area" ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                  {activeMetrics.includes('spends') && (
                    <Area
                      type="monotone"
                      dataKey="spends"
                      name="Spend ($)"
                      stroke={chartConfig.spends.color}
                      fill={`${chartConfig.spends.color}40`}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      animationDuration={1000}
                    />
                  )}
                  {activeMetrics.includes('impressions') && (
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke={chartConfig.impressions.color}
                      fill={`${chartConfig.impressions.color}40`}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      animationDuration={1200}
                    />
                  )}
                  {activeMetrics.includes('clicks') && (
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke={chartConfig.clicks.color}
                      fill={`${chartConfig.clicks.color}40`}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      animationDuration={1400}
                    />
                  )}
                  {activeMetrics.includes('installs') && (
                    <Area
                      type="monotone"
                      dataKey="installs"
                      name="Installs"
                      stroke={chartConfig.installs.color}
                      fill={`${chartConfig.installs.color}40`}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      animationDuration={1600}
                    />
                  )}
                </AreaChart>
              ) : (
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis yAxisId="left" tickFormatter={formatNumber} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={formatNumber} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                  {activeMetrics.includes('spends') && (
                    <Bar
                      yAxisId="left"
                      dataKey="spends"
                      name="Spend ($)"
                      fill={chartConfig.spends.color}
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                      animationDuration={1000}
                    />
                  )}
                  {activeMetrics.includes('impressions') && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke={chartConfig.impressions.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1200}
                    />
                  )}
                  {activeMetrics.includes('clicks') && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke={chartConfig.clicks.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1400}
                    />
                  )}
                  {activeMetrics.includes('installs') && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="installs"
                      name="Installs"
                      stroke={chartConfig.installs.color}
                      fill={`${chartConfig.installs.color}20`}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                      animationDuration={1600}
                    />
                  )}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ChartView;