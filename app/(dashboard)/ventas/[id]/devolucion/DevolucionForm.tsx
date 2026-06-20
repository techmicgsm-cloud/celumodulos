"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { procesarDevolucion } from "./actions";
import { Button } from "@/components/ui/Button";

interface DevolucionFormProps {
  ventaId: string;
  items: any[];
}

export function DevolucionForm({ ventaId, items }: DevolucionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedItem, setSelectedItem] = useState(items[0]?.id || "");
  const [cantidad, setCantidad] = useState(1);
  const [estado, setEstado] = useState("bueno");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedItemData = items.find((i) => i.id === selectedItem);
  const maxCantidad = selectedItemData?.cantidad || 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const formData = new FormData();
    formData.append("venta_id", ventaId);
    formData.append("venta_item_id", selectedItem);
    formData.append("cantidad", cantidad.toString());
    formData.append("estado", estado);

    startTransition(async () => {
      const result = await procesarDevolucion(formData);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        router.push(`/ventas/${ventaId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Seleccionar Ítem</label>
        <select
          value={selectedItem}
          onChange={(e) => {
            setSelectedItem(e.target.value);
            setCantidad(1);
          }}
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:border-copper outline-none transition-colors"
          required
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.modelo} - Vendidos: {item.cantidad} (${item.precio_unitario_venta.toLocaleString('es-AR')})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Cantidad a devolver</label>
        <input
          type="number"
          min="1"
          max={maxCantidad}
          value={cantidad}
          onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
          className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:border-copper outline-none transition-colors"
          required
        />
        <p className="text-xs text-slate-500">Máximo: {maxCantidad}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Estado del módulo</label>
        <div className="grid grid-cols-2 gap-4">
          <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${estado === 'bueno' ? 'bg-copper/10 border-copper' : 'bg-slate-900 border-slate-800'}`}>
            <input type="radio" name="estado" value="bueno" checked={estado === 'bueno'} onChange={() => setEstado('bueno')} className="sr-only" />
            <div className="font-semibold text-white mb-1">Bueno (Equivocación)</div>
            <div className="text-xs text-slate-400">Vuelve al stock para venderse</div>
          </label>
          <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${estado === 'fallado' ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-900 border-slate-800'}`}>
            <input type="radio" name="estado" value="fallado" checked={estado === 'fallado'} onChange={() => setEstado('fallado')} className="sr-only" />
            <div className="font-semibold text-white mb-1">Fallado (Garantía)</div>
            <div className="text-xs text-slate-400">No vuelve al stock</div>
          </label>
        </div>
      </div>

      {selectedItemData && (
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mt-4">
          <p className="text-sm text-slate-400">Monto total a acreditar al cliente:</p>
          <p className="text-2xl font-mono font-bold text-green-400 mt-1">
            ${(selectedItemData.precio_unitario_venta * cantidad).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      )}

      <Button type="submit" className="w-full bg-copper hover:bg-copper-hover text-black font-bold" disabled={isPending}>
        {isPending ? "Procesando..." : "Confirmar Devolución"}
      </Button>
    </form>
  );
}
