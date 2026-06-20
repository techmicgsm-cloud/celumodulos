"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MARGENES } from "@/lib/types";
import { calcularGananciaPotencial, formatARS } from "@/lib/calculations";
import { CardHeader } from "@/components/ui/Card";

const COLOR_COSTO = "#5b8aa6";
const COLOR_GANANCIA = "#4fa876";

export function MargenesChart({ capitalInvertido }: { capitalInvertido: number }) {
  const data = MARGENES.map((margen) => ({
    margen: `+${margen}%`,
    costo: capitalInvertido,
    ganancia: calcularGananciaPotencial(capitalInvertido, margen),
  }));

  return (
    <div className="rounded-lg border border-white/8 bg-bg-panel p-5">
      <CardHeader
        title="Venta sugerida por margen"
        description="Capital invertido (base) + ganancia proyectada en cada escalón de precio"
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="margen"
              stroke="#6b7280"
              tick={{ fill: "#a7adb8", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#a7adb8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}k`
              }
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "#12151b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#e9e7e2" }}
              formatter={(value, name) => [
                formatARS(Number(value) || 0),
                name === "costo" ? "Capital invertido" : "Ganancia",
              ]}
            />
            <Legend
              formatter={(value: string) =>
                value === "costo" ? "Capital invertido" : "Ganancia"
              }
              wrapperStyle={{ fontSize: 12, color: "#a7adb8" }}
            />
            <Bar dataKey="costo" stackId="a" fill={COLOR_COSTO} radius={[0, 0, 4, 4]} />
            <Bar dataKey="ganancia" stackId="a" fill={COLOR_GANANCIA} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
