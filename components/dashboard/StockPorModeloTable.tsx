import { formatARS, formatNumero } from "@/lib/calculations";

export interface StockModeloFila {
  sku: string | null;
  marca: string | null;
  modelo: string;
  cantidad: number;
  capitalInvertido: number;
  costoRealUnitarioPromedio: number;
}

export function StockPorModeloTable({ filas }: { filas: StockModeloFila[] }) {
  if (filas.length === 0) {
    return (
      <p className="text-sm text-text-secondary text-center py-10">
        Todavía no hay modelos cargados. Registrá una importación para ver el
        stock acá.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto scroll-thin -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8 text-left">
            <th className="instrument-label text-[10px] font-normal py-2.5 px-5">
              Modelo / SKU
            </th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-3 text-right">
              Stock
            </th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-3 text-right">
              Costo real prom.
            </th>
            <th className="instrument-label text-[10px] font-normal py-2.5 px-5 text-right">
              Capital invertido
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {filas.map((fila) => (
            <tr key={`${fila.sku}-${fila.modelo}`} className="hover:bg-white/3 transition-colors">
              <td className="py-3 px-5 text-text-primary text-xs flex flex-col gap-0.5">
                <span className="font-medium">{fila.marca ? `${fila.marca} ${fila.modelo}` : fila.modelo}</span>
                {fila.sku && <span className="font-mono text-[10px] text-text-muted">{fila.sku}</span>}
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-text-secondary">
                {formatNumero(fila.cantidad)} u.
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-text-secondary">
                {formatARS(fila.costoRealUnitarioPromedio)}
              </td>
              <td className="py-3 px-5 text-right tabular-nums text-copper font-medium">
                {formatARS(fila.capitalInvertido)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
