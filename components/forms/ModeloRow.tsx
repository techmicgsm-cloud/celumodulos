"use client";

import { Trash2 } from "lucide-react";
import { MARGENES, type ModeloFormInput } from "@/lib/types";
import {
  calcularCostoRealUnitario,
  calcularPreciosSugeridos,
  calcularValorTotalModelo,
  formatARS,
} from "@/lib/calculations";

export function ModeloRow({
  item,
  factor,
  onChange,
  onRemove,
  removable,
}: {
  item: ModeloFormInput;
  factor: number;
  onChange: (clienteId: string, patch: Partial<ModeloFormInput>) => void;
  onRemove: (clienteId: string) => void;
  removable: boolean;
}) {
  const costoRealUnitario = calcularCostoRealUnitario(item.precioUsdUnitario, factor);
  const valorTotal = calcularValorTotalModelo(costoRealUnitario, item.cantidad);
  const sugeridos = calcularPreciosSugeridos(costoRealUnitario);

  return (
    <tr className="hover:bg-white/3 transition-colors align-top">
      <td className="py-2.5 px-3">
        <input
          type="text"
          value={item.marca || ""}
          onChange={(e) => onChange(item.clienteId, { marca: e.target.value })}
          placeholder="Ej: Samsung"
          className="w-full min-w-[120px] rounded-md bg-bg-recessed border border-white/10 px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
        />
      </td>
      <td className="py-2.5 px-3">
        <input
          type="text"
          value={item.categoria || ""}
          onChange={(e) => onChange(item.clienteId, { categoria: e.target.value })}
          placeholder="Ej: Módulo"
          className="w-full min-w-[120px] rounded-md bg-bg-recessed border border-white/10 px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
        />
      </td>
      <td className="py-2.5 px-3">
        <input
          type="text"
          value={item.sku || ""}
          onChange={(e) => onChange(item.clienteId, { sku: e.target.value })}
          placeholder="Ej: SAM-A14"
          className="w-full min-w-[120px] rounded-md bg-bg-recessed border border-white/10 px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
        />
      </td>
      <td className="py-2.5 px-3">
        <input
          type="text"
          value={item.modelo}
          onChange={(e) => onChange(item.clienteId, { modelo: e.target.value })}
          placeholder="Ej: A14 OLED"
          className="w-full min-w-[180px] rounded-md bg-bg-recessed border border-white/10 px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
        />
      </td>
      <td className="py-2.5 px-2">
        <input
          type="number"
          min={1}
          step={1}
          value={item.cantidad || ""}
          onChange={(e) => onChange(item.clienteId, { cantidad: Number(e.target.value) })}
          placeholder="0"
          className="w-20 rounded-md bg-bg-recessed border border-white/10 px-2.5 py-1.5 text-sm text-text-primary tabular-nums placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
        />
      </td>
      <td className="py-2.5 px-2">
        <input
          type="number"
          min={0}
          step={0.01}
          value={item.precioUsdUnitario || ""}
          onChange={(e) =>
            onChange(item.clienteId, { precioUsdUnitario: Number(e.target.value) })
          }
          placeholder="0.00"
          className="w-24 rounded-md bg-bg-recessed border border-white/10 px-2.5 py-1.5 text-sm text-text-primary tabular-nums placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
        />
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-text-secondary whitespace-nowrap">
        {formatARS(costoRealUnitario)}
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-copper font-medium whitespace-nowrap">
        {formatARS(valorTotal)}
      </td>
      {MARGENES.map((margen) => (
        <td
          key={margen}
          className="py-2.5 px-3 text-right tabular-nums text-text-secondary whitespace-nowrap"
        >
          {formatARS(sugeridos[margen])}
        </td>
      ))}
      <td className="py-2.5 px-3 text-right">
        <button
          type="button"
          onClick={() => onRemove(item.clienteId)}
          disabled={!removable}
          className="text-text-muted hover:text-signal-red disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Quitar modelo"
        >
          <Trash2 size={15} strokeWidth={1.75} />
        </button>
      </td>
    </tr>
  );
}
