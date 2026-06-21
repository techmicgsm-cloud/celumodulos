import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Package, Wallet } from "lucide-react";
import { obtenerImportacionPorId } from "@/lib/data";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { InstrumentPanel } from "@/components/ui/InstrumentPanel";
import { ModelosDetailTable } from "@/components/importaciones/ModelosDetailTable";
import { ExportButtons } from "@/components/importaciones/ExportButtons";
import { formatARS, formatFecha, formatNumero, formatUSD } from "@/lib/calculations";

export default async function ImportacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const importacion = await obtenerImportacionPorId(id);

  if (!importacion) {
    notFound();
  }

  const { modelos } = importacion;
  const stockTotal = modelos.reduce((acc, m) => acc + m.cantidad, 0);
  const capitalInvertido = modelos.reduce((acc, m) => acc + m.valor_total, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/importaciones"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mb-3"
        >
          <ArrowLeft size={13} />
          Historial de importaciones
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-text-primary tracking-tight">
              {importacion.nombre ?? "Importación sin nombre"}
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              Registrada el {formatFecha(importacion.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href={`/importaciones/${importacion.id}/editar`}
              className="inline-flex items-center gap-2 rounded-md bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm font-medium text-white transition-colors border border-slate-700"
            >
              Editar Importación
            </Link>
            <ExportButtons tipo="detalle" importacion={importacion} modelos={modelos} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="USD mercadería"
          value={formatUSD(importacion.total_usd_mercaderia)}
          icon={Wallet}
        />
        <StatCard
          label="Gasto total"
          value={formatARS(importacion.gasto_total_pesos)}
          icon={Wallet}
        />
        <StatCard
          label="Stock de esta importación"
          value={`${formatNumero(stockTotal)} u.`}
          sublabel={`${modelos.length} modelos`}
          icon={Package}
        />
        <InstrumentPanel
          label="Factor"
          value={importacion.factor.toFixed(2)}
          unit="$/U$D"
          size="md"
        />
      </div>

      {importacion.factura_url && (
        <Card padded={false}>
          <Link
            href={importacion.factura_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-4 hover:bg-white/3 transition-colors rounded-lg"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-steel/10 text-steel shrink-0">
              <FileText size={17} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-text-primary">
                {importacion.factura_nombre_archivo ?? "Ver factura cargada"}
              </p>
              <p className="text-xs text-text-muted">Abrir factura de compra</p>
            </div>
          </Link>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Modelos"
          description="Costo real, valor total y precios de venta sugeridos por modelo"
        />
        <ModelosDetailTable modelos={modelos} />
        <div className="mt-5 pt-5 border-t border-white/8 flex items-center justify-between">
          <p className="text-sm text-text-secondary">Capital invertido en esta importación</p>
          <p className="text-lg font-semibold text-copper tabular-nums">
            {formatARS(capitalInvertido)}
          </p>
        </div>
      </Card>

      {importacion.notas && (
        <Card>
          <CardHeader title="Notas" />
          <p className="text-sm text-text-secondary whitespace-pre-wrap">
            {importacion.notas}
          </p>
        </Card>
      )}
    </div>
  );
}
