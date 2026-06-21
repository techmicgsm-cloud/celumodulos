import Link from "next/link";
import { RefreshCcw, Search, ExternalLink } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { obtenerDevoluciones } from "@/lib/data";

export default async function DevolucionesPage() {
  const devoluciones = await obtenerDevoluciones();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <RefreshCcw className="h-8 w-8 text-copper" />
            Devoluciones / RMA
          </h1>
          <p className="text-slate-400 mt-1">
            Historial de todos los módulos devueltos por clientes.
          </p>
        </div>
        <Link href="/devoluciones/nueva">
          <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Nueva Devolución
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader title="Historial de Devoluciones" />
        <div className="overflow-x-auto">
          {devoluciones.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCcw className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No hay devoluciones registradas en el sistema.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-y border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Fecha</th>
                  <th className="px-6 py-3 font-semibold">Cliente</th>
                  <th className="px-6 py-3 font-semibold">Módulo Devuelto</th>
                  <th className="px-6 py-3 font-semibold text-center">Estado</th>
                  <th className="px-6 py-3 font-semibold text-right">Monto Acreditado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {devoluciones.map((dev: any) => {
                  const clienteNombre = dev.venta_item?.venta?.cliente?.nombre_local || "Consumidor Final";
                  const modeloNombre = dev.venta_item?.modelo || "Módulo desconocido";
                  
                  return (
                    <tr key={dev.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                        {new Intl.DateTimeFormat("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(dev.created_at))}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {clienteNombre}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {dev.cantidad}x {modeloNombre}
                        <br />
                        <span className="text-xs text-slate-500 font-mono">
                          Ref Venta: {dev.venta_item?.venta_id?.split("-")[0] || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            dev.estado === "bueno"
                              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                              : "bg-red-400/10 text-red-400 border-red-400/20"
                          }`}
                        >
                          {dev.estado === "bueno" ? "Regresó a Stock" : "Fallado (Garantía)"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="font-mono font-medium text-emerald-400">
                          ${Number(dev.monto_acreditado).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
