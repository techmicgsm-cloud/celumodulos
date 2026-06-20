import { MARGENES, type ModeloItem } from "@/lib/types";
import { calcularPreciosSugeridos, formatARS, formatUSD } from "@/lib/calculations";

export function ModelosDetailTable({ modelos }: { modelos: ModeloItem[] }) {
  if (modelos.length === 0) {
    return (
      <p className="text-sm text-text-secondary text-center py-10">
        Esta importación todavía no tiene modelos cargados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto scroll-thin -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8 text-left">
            <th className="instrument-label text-[10px] font-normal py-2.5 px-5">Modelo</th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-3 text-right">
              Cant.
            </th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-3 text-right">
              USD unit.
            </th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-3 text-right">
              Costo real
            </th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-3 text-right">
              Valor total
            </th>
            {MARGENES.map((margen) => (
              <th
                key={margen}
                className="instrument-label text-[10px] font-normal py-2.5 px-3 text-right whitespace-nowrap"
              >
                PV {margen}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {modelos.map((m) => {
            const sugeridos = calcularPreciosSugeridos(m.costo_real_unitario);
            return (
              <tr key={m.id} className="hover:bg-white/3 transition-colors">
                <td className="py-3 px-5 text-text-primary font-mono text-xs whitespace-nowrap">
                  {m.modelo}
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-text-secondary">
                  {m.cantidad}
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-text-secondary whitespace-nowrap">
                  {formatUSD(m.precio_usd_unitario)}
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-text-secondary whitespace-nowrap">
                  {formatARS(m.costo_real_unitario)}
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-copper font-medium whitespace-nowrap">
                  {formatARS(m.valor_total)}
                </td>
                {MARGENES.map((margen) => (
                  <td
                    key={margen}
                    className="py-3 px-3 text-right tabular-nums text-text-secondary whitespace-nowrap"
                  >
                    {formatARS(sugeridos[margen])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
