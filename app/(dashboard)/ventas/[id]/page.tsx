import { obtenerVentaPorId } from "@/lib/data";
import { formatARS } from "@/lib/calculations";
import { Card, CardHeader } from "@/components/ui/Card";
import { ArrowLeft, Package, User, Receipt, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";
import { BotonImprimirTicket } from "@/components/ventas/BotonImprimirTicket";

export default async function DetalleVentaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const venta = await obtenerVentaPorId(resolvedParams.id);

  if (!venta) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Package className="h-16 w-16 mb-4 opacity-20" />
        <h2 className="text-xl font-semibold text-white mb-2">Venta no encontrada</h2>
        <p className="mb-6">La venta que buscas no existe o fue eliminada.</p>
        <Link href="/ventas" className="text-copper hover:underline">Volver a ventas</Link>
      </div>
    );
  }

  const fecha = new Date(venta.created_at).toLocaleString("es-AR");
  const clienteNombre = venta.cliente?.nombre_local || venta.cliente_nombre || "Consumidor Final";

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ventas" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            Detalle de Venta
          </h1>
        </div>
        <BotonImprimirTicket ventaId={venta.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Información General" />
          <div className="p-6 space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="flex items-center gap-2 text-slate-400"><Receipt className="h-4 w-4" /> ID Venta</span>
              <span className="font-mono text-xs">{venta.id.split('-')[0].toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="flex items-center gap-2 text-slate-400"><Calendar className="h-4 w-4" /> Fecha y Hora</span>
              <span>{fecha}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="flex items-center gap-2 text-slate-400"><User className="h-4 w-4" /> Cliente</span>
              <span className="font-medium text-white">{clienteNombre}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="flex items-center gap-2 text-slate-400"><DollarSign className="h-4 w-4" /> Método de Pago</span>
              <span className="capitalize">{venta.metodo_pago.replace('_', ' ')}</span>
            </div>
            {venta.notas && (
              <div className="pt-2">
                <span className="block text-slate-400 mb-1">Notas:</span>
                <p className="bg-slate-800/50 p-3 rounded-md italic">{venta.notas}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Resumen Financiero" />
          <div className="p-6 space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Total Venta</span>
              <span className="text-lg font-bold text-white">{formatARS(venta.total_venta)}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Costo Total (FIFO)</span>
              <span>{formatARS(venta.total_costo)}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-400">Ganancia Neta</span>
              <span className="text-lg font-bold text-emerald-400">{formatARS(venta.ganancia_neta)}</span>
            </div>
            
            {venta.total_venta > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>Margen de Ganancia</span>
                <span>{((venta.ganancia_neta / venta.total_venta) * 100).toFixed(2)}%</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Artículos Vendidos" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3 text-center">Cant.</th>
                <th className="px-4 py-3 text-right">Precio Unit.</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {venta.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-200">{item.modelo}</div>
                    {item.sku && <div className="text-xs text-slate-500">SKU: {item.sku}</div>}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-300">
                    {item.cantidad}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatARS(item.precio_unitario_venta)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">
                    {formatARS(item.precio_unitario_venta * item.cantidad)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
