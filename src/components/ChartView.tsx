import React, { useState, useMemo, useEffect } from "react";
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
  Download,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Chart Config for colors
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // It handles the responsive layout of the graph data
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // If mobile and there are many data points, trim down
    const processedData = data.map((row) => ({
      name: isMobile ? 
        (String(row.creative_name || row.campaign || "").substring(0, 10) + (String(row.creative_name || row.campaign || "").length > 10 ? "..." : "")) : 
        String(row.creative_name || row.campaign || ""),
      spends: Number(row.spend) || 0,
      impressions: Number(row.impressions) || 0,
      clicks: Number(row.clicks) || 0,
      installs: Number(row.installs) || 0,
      // Calculate CTR and conversion rates for insights
      ctr: row.impressions ? ((Number(row.clicks) / Number(row.impressions)) * 100).toFixed(2) : "0",
      cvr: row.clicks ? ((Number(row.installs) / Number(row.clicks)) * 100).toFixed(2) : "0",
    }));

    // If too many items for mobile, limit the number of displayed items
    if (isMobile && processedData.length > 6) {
      return processedData.slice(0, 6); // Show only top 6 on mobile
    }
    
    return processedData;
  }, [data, isMobile]);

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

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    // Add event listener to handle ESC key to exit fullscreen
    if (!isFullscreen) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setIsFullscreen(false);
      });
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 sm:p-4 border rounded-md shadow-lg max-w-xs sm:max-w-sm">
          <p className="font-medium text-gray-900 border-b pb-1 sm:pb-2 mb-1 sm:mb-2 text-sm sm:text-base truncate">{label}</p>
          <div className="space-y-1 sm:space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <div 
                  className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" 
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
      <div className="flex flex-wrap justify-center gap-2 sm:gap-5 mt-1 sm:mt-3 px-1">
        {payload.map((entry: any, index: number) => (
          <div 
            key={index} 
            className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:bg-gray-50 py-1 px-2 rounded-full transition-colors"
            onClick={() => toggleMetric(entry.dataKey)}
          >
            <div 
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${!activeMetrics.includes(entry.dataKey) ? 'opacity-30' : ''}`} 
              style={{ backgroundColor: entry.color }}
            />
            <span className={`text-xs sm:text-sm font-medium ${!activeMetrics.includes(entry.dataKey) ? 'text-gray-400' : 'text-gray-700'}`}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Calculate chart height based on fullscreen state and device
  const chartHeight = isFullscreen 
    ? "calc(100vh - 240px)" 
    : isMobile ? "300px" : screenWidth < 1024 ? "400px" : "500px";

  // Adjust XAxis angle based on screen size
  const xAxisAngle = isMobile ? -65 : screenWidth < 1024 ? -55 : -45;
  
  // Adjust bar size for different screen sizes
  const barSize = isMobile ? 15 : screenWidth < 1024 ? 20 : 30;
  
  // Adjust margins for different screen sizes
  const chartMargin = isMobile 
    ? { top: 15, right: 10, left: 5, bottom: 80 }
    : screenWidth < 1024 
      ? { top: 20, right: 20, left: 15, bottom: 80 }
      : { top: 20, right: 30, left: 20, bottom: 80 };

  const showRightYAxis = !isMobile || isFullscreen;

  return (
    <Card className={`w-full shadow-lg border-t-4 border-t-blue-600 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Performance Analytics</CardTitle>
            <CardDescription className="text-gray-600 text-sm sm:text-base">
              {isMobile 
                ? `Showing top ${chartData.length} creatives` 
                : `Visualizing campaign metrics across ${data.length} creatives`}
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <ToggleGroup type="single" value={chartType} onValueChange={(val) => val && setChartType(val as any)} className="bg-gray-50 p-1 rounded-md">
              <ToggleGroupItem value="bar" aria-label="Bar Chart" className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600 cursor-pointer">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="line" aria-label="Line Chart" className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600 cursor-pointer">
                <LineChartIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="area" aria-label="Area Chart" className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600 cursor-pointer">
                <AreaChartIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="composed" aria-label="Composed Chart" className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600 cursor-pointer">
                <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            
            <Button variant="outline" size="icon" onClick={handleDownload} className="hover:bg-gray-50 cursor-pointer h-8 w-8">
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            
            <Button variant="outline" size="icon" onClick={toggleFullscreen} className="hover:bg-gray-50 cursor-pointer h-8 w-8">
              <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        
        {/* Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
          <Badge variant="outline" className="w-full flex flex-col justify-between p-2 sm:p-4 rounded-lg border-2 border-purple-100 hover:bg-purple-50 transition-colors">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Total Spend</span>
            <span className="mt-1 text-base sm:text-xl font-bold text-purple-700 whitespace-nowrap">
              ${formatNumber(metrics.totals.spends)}
            </span>
          </Badge>
          <Badge variant="outline" className="w-full flex flex-col justify-between p-2 sm:p-4 rounded-lg border-2 border-blue-100 hover:bg-blue-50 transition-colors">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Impressions</span>
            <span className="mt-1 text-base sm:text-xl font-bold text-blue-700 whitespace-nowrap">
              {formatNumber(metrics.totals.impressions)}
            </span>
          </Badge>
          <Badge variant="outline" className="w-full flex flex-col justify-between p-2 sm:p-4 rounded-lg border-2 border-green-100 hover:bg-green-50 transition-colors">
            <span className="text-xs sm:text-sm font-medium text-gray-700">CTR</span>
            <span className="mt-1 text-base sm:text-xl font-bold text-green-700 whitespace-nowrap">
              {metrics.ctr}%
            </span>
          </Badge>
          <Badge variant="outline" className="w-full flex flex-col justify-between p-2 sm:p-4 rounded-lg border-2 border-amber-100 hover:bg-amber-50 transition-colors">
            <span className="text-xs sm:text-sm font-medium text-gray-700">CVR</span>
            <span className="mt-1 text-base sm:text-xl font-bold text-amber-700 whitespace-nowrap">
              {metrics.cvr}%
            </span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={chartConfig} className={`w-full ${isFullscreen ? 'h-full' : 'min-h-[300px] sm:min-h-[400px]'}`}>
          <div className="w-full" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={chartMargin}
                  barGap={isMobile ? 5 : 10}
                  barSize={barSize}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={xAxisAngle}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickLine={{ stroke: "#e0e0e0" }}
                    interval={0}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    stroke={chartConfig.spends.color}
                    tickFormatter={formatNumber}
                    tickLine={{ stroke: "#e0e0e0" }}
                    width={isMobile ? 40 : 60}
                    fontSize={isMobile ? 10 : 12}
                  />
                  {showRightYAxis && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={chartConfig.impressions.color}
                      tickFormatter={formatNumber}
                      tickLine={{ stroke: "#e0e0e0" }}
                      width={isMobile ? 40 : 60}
                      fontSize={isMobile ? 10 : 12}
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                  <Legend content={<CustomLegend />} />
                  {activeMetrics.includes('spends') && (
                    <Bar
                      yAxisId="left"
                      dataKey="spends"
                      name="Spend ($)"
                      fill={chartConfig.spends.color}
                      radius={[6, 6, 0, 0]}
                      animationDuration={1000}
                    />
                  )}
                  {activeMetrics.includes('impressions') && (
                    <Bar
                      yAxisId={showRightYAxis ? "right" : "left"}
                      dataKey="impressions"
                      name="Impressions"
                      fill={chartConfig.impressions.color}
                      radius={[6, 6, 0, 0]}
                      animationDuration={1200}
                    />
                  )}
                  {activeMetrics.includes('clicks') && (
                    <Bar
                      yAxisId="left"
                      dataKey="clicks"
                      name="Clicks"
                      fill={chartConfig.clicks.color}
                      radius={[6, 6, 0, 0]}
                      animationDuration={1400}
                    />
                  )}
                  {activeMetrics.includes('installs') && (
                    <Bar
                      yAxisId="left"
                      dataKey="installs"
                      name="Installs"
                      fill={chartConfig.installs.color}
                      radius={[6, 6, 0, 0]}
                      animationDuration={1600}
                    />
                  )}
                </BarChart>
              ) : chartType === "line" ? (
                <LineChart
                  data={chartData}
                  margin={chartMargin}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={xAxisAngle}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickLine={{ stroke: "#e0e0e0" }}
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={formatNumber} 
                    tickLine={{ stroke: "#e0e0e0" }}
                    width={isMobile ? 40 : 60}
                    fontSize={isMobile ? 10 : 12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                  {activeMetrics.includes('spends') && (
                    <Line
                      type="monotone"
                      dataKey="spends"
                      name="Spend ($)"
                      stroke={chartConfig.spends.color}
                      strokeWidth={isMobile ? 2 : 3}
                      dot={{ r: isMobile ? 3 : 5, strokeWidth: isMobile ? 1 : 2, fill: "white", stroke: chartConfig.spends.color }}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
                      animationDuration={1000}
                    />
                  )}
                  {activeMetrics.includes('impressions') && (
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke={chartConfig.impressions.color}
                      strokeWidth={isMobile ? 2 : 3}
                      dot={{ r: isMobile ? 3 : 5, strokeWidth: isMobile ? 1 : 2, fill: "white", stroke: chartConfig.impressions.color }}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
                      animationDuration={1200}
                    />
                  )}
                  {activeMetrics.includes('clicks') && (
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke={chartConfig.clicks.color}
                      strokeWidth={isMobile ? 2 : 3}
                      dot={{ r: isMobile ? 3 : 5, strokeWidth: isMobile ? 1 : 2, fill: "white", stroke: chartConfig.clicks.color }}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
                      animationDuration={1400}
                    />
                  )}
                  {activeMetrics.includes('installs') && (
                    <Line
                      type="monotone"
                      dataKey="installs"
                      name="Installs"
                      stroke={chartConfig.installs.color}
                      strokeWidth={isMobile ? 2 : 3}
                      dot={{ r: isMobile ? 3 : 5, strokeWidth: isMobile ? 1 : 2, fill: "white", stroke: chartConfig.installs.color }}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
                      animationDuration={1600}
                    />
                  )}
                </LineChart>
              ) : chartType === "area" ? (
                <AreaChart
                  data={chartData}
                  margin={chartMargin}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={xAxisAngle}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickLine={{ stroke: "#e0e0e0" }}
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={formatNumber} 
                    tickLine={{ stroke: "#e0e0e0" }}
                    width={isMobile ? 40 : 60}
                    fontSize={isMobile ? 10 : 12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                  {activeMetrics.includes('spends') && (
                    <Area
                      type="monotone"
                      dataKey="spends"
                      name="Spend ($)"
                      stroke={chartConfig.spends.color}
                      fill={`${chartConfig.spends.color}30`}
                      strokeWidth={isMobile ? 2 : 3}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
                      animationDuration={1000}
                    />
                  )}
                  {activeMetrics.includes('impressions') && (
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke={chartConfig.impressions.color}
                      fill={`${chartConfig.impressions.color}30`}
                      strokeWidth={isMobile ? 2 : 3}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
                      animationDuration={1200}
                    />
                  )}
                  {activeMetrics.includes('clicks') && (
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke={chartConfig.clicks.color}
                      fill={`${chartConfig.clicks.color}30`}
                      strokeWidth={isMobile ? 2 : 3}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
                      animationDuration={1400}
                    />
                  )}
                  {activeMetrics.includes('installs') && (
                    <Area
                      type="monotone"
                      dataKey="installs"
                      name="Installs"
                      stroke={chartConfig.installs.color}
                      fill={`${chartConfig.installs.color}30`}
                      strokeWidth={isMobile ? 2 : 3}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
                      animationDuration={1600}
                    />
                  )}
                </AreaChart>
              ) : (
                <ComposedChart
                  data={chartData}
                  margin={chartMargin}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    angle={xAxisAngle}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    tickLine={{ stroke: "#e0e0e0" }}
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tickFormatter={formatNumber}
                    tickLine={{ stroke: "#e0e0e0" }}
                    width={isMobile ? 40 : 60}
                    fontSize={isMobile ? 10 : 12}
                  />
                  {showRightYAxis && (
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tickFormatter={formatNumber}
                      tickLine={{ stroke: "#e0e0e0" }}
                      width={isMobile ? 40 : 60}
                      fontSize={isMobile ? 10 : 12}
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                  {activeMetrics.includes('spends') && (
                    <Bar
                      yAxisId="left"
                      dataKey="spends"
                      name="Spend ($)"
                      fill={chartConfig.spends.color}
                      radius={[6, 6, 0, 0]}
                      barSize={isMobile ? 15 : 25}
                      animationDuration={1000}
                    />
                  )}
                  {activeMetrics.includes('impressions') && (
                    <Line
                      yAxisId={showRightYAxis ? "right" : "left"}
                      type="monotone"
                      dataKey="impressions"
                      name="Impressions"
                      stroke={chartConfig.impressions.color}
                      strokeWidth={isMobile ? 2 : 3}
                      dot={{ r: isMobile ? 3 : 5, strokeWidth: isMobile ? 1 : 2, fill: "white", stroke: chartConfig.impressions.color }}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
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
                      strokeWidth={isMobile ? 2 : 3}
                      dot={{ r: isMobile ? 3 : 5, strokeWidth: isMobile ? 1 : 2, fill: "white", stroke: chartConfig.clicks.color }}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
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
                      strokeWidth={isMobile ? 2 : 3}
                      activeDot={{ r: isMobile ? 5 : 8, strokeWidth: isMobile ? 1 : 2 }}
                      animationDuration={1600}
                    />
                  )}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </ChartContainer>
        
        {isFullscreen && (
          <div className="absolute bottom-4 right-4">
            <Button onClick={toggleFullscreen} className="bg-white text-gray-800 hover:bg-gray-100 shadow-lg text-xs sm:text-sm p-2 sm:p-4">
              Exit Fullscreen
            </Button>
          </div>
        )}
        
        
        {isMobile && data.length > 6 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Showing {chartData.length} of {data.length} items. 
              {!isFullscreen && <span> Tap fullscreen for complete view.</span>}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartView;