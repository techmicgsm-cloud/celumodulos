import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { obtenerVentas } from "@/lib/data";
import { formatARS } from "@/lib/calculations";
import { BotonImprimirTicket } from "@/components/ventas/BotonImprimirTicket";

export default async function VentasPage() {
  const ventas = await obtenerVentas();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-copper" />
            Ventas
          </h1>
          <p className="text-slate-400 mt-1">
            Historial de ventas y ganancias (FIFO).
          </p>
        </div>
        <Link href="/ventas/nueva">
          <Button className="w-full sm:w-auto bg-copper hover:bg-copper-hover text-black font-semibold">
            <Plus className="mr-2 h-4 w-4" />
            Nueva venta
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader title="Últimas ventas" />
        
          {ventas.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Todavía no registraste ninguna venta.</p>
              <Link href="/ventas/nueva">
                <Button variant="secondary" className="mt-4">
                  Cargar primera venta
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3 text-right">Total Venta</th>
                    <th className="px-4 py-3 text-right">Costo Total</th>
                    <th className="px-4 py-3 text-right text-emerald-400">Ganancia</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {ventas.map((venta) => (
                    <tr key={venta.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(venta.created_at).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {venta.cliente?.nombre_local || venta.cliente_nombre || "Consumidor Final"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-white">
                        {formatARS(venta.total_venta)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {formatARS(venta.total_costo)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-400">
                        {formatARS(venta.ganancia_neta)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <BotonImprimirTicket ventaId={venta.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        
      </Card>
    </div>
  );
}
