import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Importacion } from "@/lib/types";
import { formatARS, formatFecha, formatUSD } from "@/lib/calculations";

export function ImportacionesTable({
  importaciones,
}: {
  importaciones: Importacion[];
}) {
  if (importaciones.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-text-secondary">
          Todavía no registraste ninguna importación.
        </p>
        <Link
          href="/importaciones/nueva"
          className="text-sm text-copper hover:text-copper-bright mt-2 inline-block"
        >
          Cargar la primera factura →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scroll-thin -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8 text-left">
            <th className="instrument-label text-[10px] font-normal py-2.5 px-5 whitespace-nowrap">
              Fecha
            </th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-3 whitespace-nowrap">
              Nombre
            </th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-3 whitespace-nowrap text-right">
              USD mercadería
            </th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-3 whitespace-nowrap text-right">
              Gasto (ARS)
            </th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-3 whitespace-nowrap text-right">
              Factor
            </th>
            <th className="py-2.5 px-5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {importaciones.map((imp) => (
            <tr key={imp.id} className="hover:bg-white/3 transition-colors">
              <td className="py-3 px-5 text-text-secondary whitespace-nowrap font-mono text-xs">
                {formatFecha(imp.created_at)}
              </td>
              <td className="py-3 px-3 text-text-primary whitespace-nowrap">
                {imp.nombre ?? "Sin nombre"}
              </td>
              <td className="py-3 px-3 text-text-secondary text-right tabular-nums whitespace-nowrap">
                {formatUSD(imp.total_usd_mercaderia)}
              </td>
              <td className="py-3 px-3 text-text-secondary text-right tabular-nums whitespace-nowrap">
                {formatARS(imp.gasto_total_pesos)}
              </td>
              <td className="py-3 px-3 text-copper text-right tabular-nums font-mono whitespace-nowrap">
                {imp.factor.toFixed(2)}
              </td>
              <td className="py-3 px-5 text-right">
                <Link
                  href={`/importaciones/${imp.id}`}
                  className="inline-flex items-center gap-1 text-xs text-steel hover:text-steel-bright whitespace-nowrap"
                >
                  Ver detalle <ArrowUpRight size={13} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
