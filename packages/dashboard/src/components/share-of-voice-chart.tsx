"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ShareOfVoiceChartProps {
  data: Array<{ brand: string; percentage: number }>;
}

const COLORS = ["#818cf8", "#6366f1", "#4f46e5", "#4338ca"];

export function ShareOfVoiceChart({ data }: ShareOfVoiceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
        <XAxis type="number" stroke="#6b7280" fontSize={12} domain={[0, 100]} unit="%" />
        <YAxis dataKey="brand" type="category" stroke="#6b7280" fontSize={12} width={100} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111827",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#fff",
          }}
          formatter={(value) => [`${Number(value).toFixed(1)}%`, "Share"]}
        />
        <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
