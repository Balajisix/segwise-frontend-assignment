import React from "react";
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
} from "recharts";
import { CreativeRow } from "../pages/Home";
import { ChartContainer } from "@/components/ui/chart";
import { type ChartConfig } from "@/components/ui/chart"
 
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig

interface ChartViewProps {
  data: CreativeRow[];
  viewMode: "summary" | "trend";
}

const ChartView: React.FC<ChartViewProps> = ({ data, viewMode }) => {
  // Transform data: group by creative_name (or campaign)
  const chartData = data.map((row) => ({
    name: String(row.creative_name || row.campaign || ""),
    spends: Number(row.spend) || 0,
    impressions: Number(row.impressions) || 0,
    clicks: Number(row.clicks) || 0,
    installs: Number(row.installs) || 0,
  }));

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "summary" ? (
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="spends" name="Spend" />
              <Bar dataKey="impressions" name="Impressions" />
              <Bar dataKey="clicks" name="Clicks" />
              <Bar dataKey="installs" name="Installs" />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="spends" name="Spend" />
              <Line type="monotone" dataKey="impressions" name="Impressions" />
              <Line type="monotone" dataKey="clicks" name="Clicks" />
              <Line type="monotone" dataKey="installs" name="Installs" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

export default ChartView;