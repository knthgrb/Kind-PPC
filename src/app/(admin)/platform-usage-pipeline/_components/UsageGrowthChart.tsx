"use client";

import React from "react";
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ComposedChart,
  Cell,
} from "recharts";
import CustomTooltipWithLabel from "../../_components/CustomTooltipWithLabel";

interface LineChartProps {
  data: { period: string; usage: number; trend: number }[];
  expectedUsage: number;
}

export default function MonthlyRevenueLineChart({
  data,
  expectedUsage,
}: LineChartProps) {
  return (
    <div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
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
              tick={{ fontSize: 12, fill: "#000000" }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#000000" }}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Bar dataKey="usage" radius={[5, 5, 0, 0]} barSize={30}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.usage < expectedUsage ? "#FF7A8A" : "#EF4444"}
                />
              ))}
            </Bar>
            <Line
              type="linear"
              dataKey="trend"
              stroke="#EF4444"
              strokeWidth={1}
              dot={false}
            />
            <Tooltip content={<CustomTooltipWithLabel />} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
