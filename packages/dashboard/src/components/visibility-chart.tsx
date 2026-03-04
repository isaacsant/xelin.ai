"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VisibilityChartProps {
  data: Array<{ date: string; score: number }>;
}

export function VisibilityChart({ data }: VisibilityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#818cf8"
          strokeWidth={2}
          dot={{ fill: "#818cf8", r: 4 }}
          activeDot={{ r: 6, fill: "#6366f1" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
