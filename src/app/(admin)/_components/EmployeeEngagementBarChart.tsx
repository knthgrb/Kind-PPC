"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import CustomTooltipWithLabel from "./CustomTooltipWithLabel";

interface BarChartProps {
  data: { period: string; value: number; trend: number }[];
}

export default function employeeEngagementBarChart({ data }: BarChartProps) {
  return (
    <div>
      <div className="flex-1 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap={6}>
            <CartesianGrid
              strokeDasharray="0 0"
              stroke="#E5E7EB"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 7.65, fill: "#000000" }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 7.65, fill: "#000000" }}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Bar
              dataKey="trend"
              stackId="value"
              fill="#FCA5A5"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="value"
              stackId="value"
              fill="#DC2626"
              radius={[4, 4, 0, 0]}
            />
            <Tooltip
              content={<CustomTooltipWithLabel />}
              cursor={{
                fill: "rgba(220,38,38,0.1)",
                stroke: "#DC2626",
                strokeWidth: 1,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
