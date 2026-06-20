import { Boxes, Wallet, Package, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { obtenerImportaciones, obtenerTodosLosModelos } from "@/lib/data";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { InstrumentPanel } from "@/components/ui/InstrumentPanel";
import { MarginExplorer } from "@/components/dashboard/MarginExplorer";
import { MargenesChart } from "@/components/dashboard/MargenesChart";
import {
  StockPorModeloTable,
  type StockModeloFila,
} from "@/components/dashboard/StockPorModeloTable";
import { ImportacionesTable } from "@/components/importaciones/ImportacionesTable";
import { formatARS, formatNumero } from "@/lib/calculations";

export default async function DashboardPage() {
  const [importaciones, modelos] = await Promise.all([
    obtenerImportaciones(),
    obtenerTodosLosModelos(),
  ]);

  const stockTotal = modelos.reduce((acc, m) => acc + m.cantidad, 0);
  const capitalInvertido = modelos.reduce((acc, m) => acc + m.valor_total, 0);

  const sumaUsdMercaderia = importaciones.reduce(
    (acc, imp) => acc + imp.total_usd_mercaderia,
    0
  );
  const sumaGastoPesos = importaciones.reduce(
    (acc, imp) => acc + imp.gasto_total_pesos,
    0
  );
  const factorPromedio = sumaUsdMercaderia > 0 ? sumaGastoPesos / sumaUsdMercaderia : 0;

  const stockPorModeloMap = new Map<string, { cantidad: number; capital: number; marca: string | null; sku: string | null; modelo: string }>();
  for (const m of modelos) {
    const key = m.sku ? m.sku : m.modelo;
    const actual = stockPorModeloMap.get(key) ?? { cantidad: 0, capital: 0, marca: m.marca, sku: m.sku, modelo: m.modelo };
    actual.cantidad += m.cantidad; // m.cantidad es cantidad_disponible según data.ts
    actual.capital += m.valor_total;
    stockPorModeloMap.set(key, actual);
  }
  const stockPorModelo: StockModeloFila[] = Array.from(stockPorModeloMap.values())
    .map(({ modelo, marca, sku, cantidad, capital }) => ({
      modelo,
      marca,
      sku,
      cantidad,
      capitalInvertido: capital,
      costoRealUnitarioPromedio: cantidad > 0 ? capital / cantidad : 0,
    }))
    .sort((a, b) => b.capitalInvertido - a.capitalInvertido);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Vista general de stock, capital invertido y rentabilidad proyectada.
          </p>
        </div>
        <Link
          href="/importaciones/nueva"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm text-copper hover:text-copper-bright"
        >
          Nueva importación <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Stock total"
          value={`${formatNumero(stockTotal)} u.`}
          sublabel={`${stockPorModelo.length} modelos distintos`}
          icon={Package}
        />
        <StatCard
          label="Capital invertido"
          value={formatARS(capitalInvertido)}
          sublabel="Costo real del stock actual"
          icon={Wallet}
          tone="copper"
        />
        <StatCard
          label="Importaciones"
          value={formatNumero(importaciones.length)}
          sublabel="Facturas cargadas"
          icon={Boxes}
        />
        <InstrumentPanel
          label="Factor promedio"
          value={factorPromedio > 0 ? factorPromedio.toFixed(2) : "—"}
          unit="$/U$D"
          sublabel="Ponderado por todas las importaciones"
          size="md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MargenesChart capitalInvertido={capitalInvertido} />
        <MarginExplorer capitalInvertido={capitalInvertido} />
      </div>

      <Card>
        <CardHeader
          title="Stock por modelo"
          description="Unidades y capital invertido acumulados de todas las importaciones"
        />
        <StockPorModeloTable filas={stockPorModelo} />
      </Card>

      <Card>
        <CardHeader
          title="Últimas importaciones"
          action={
            <Link
              href="/importaciones"
              className="text-xs text-steel hover:text-steel-bright inline-flex items-center gap-1"
            >
              Ver historial completo <ArrowUpRight size={12} />
            </Link>
          }
        />
        <ImportacionesTable importaciones={importaciones.slice(0, 5)} />
      </Card>
    </div>
  );
}
