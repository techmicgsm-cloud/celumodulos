"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertTriangle, Info } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatUSD } from "@/lib/calculations";
import { crearVenta, VentaItemInput } from "@/app/(dashboard)/ventas/nueva/actions";
import { StockAgrupado, Cliente } from "@/lib/types";

interface VentaItemUI extends VentaItemInput {
  uiId: string;
}

export function NuevaVentaForm({ 
  stockDisponible, 
  clientes 
}: { 
  stockDisponible: StockAgrupado[],
  clientes: Cliente[]
}) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState("");
  const [notas, setNotas] = useState("");
  const [usarSaldo, setUsarSaldo] = useState(false);
  const [saldoADescontar, setSaldoADescontar] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const clienteSeleccionado = clientes.find(c => c.id === clienteId);
  const saldoDisponible = clienteSeleccionado?.saldo_actual || 0;

  const [items, setItems] = useState<VentaItemUI[]>([
    { uiId: crypto.randomUUID(), modelo: "", sku: "", cantidad: 1, precio_venta_unitario: 0 }
  ]);

  function addItem() {
    setItems(prev => [
      ...prev,
      { uiId: crypto.randomUUID(), modelo: "", sku: "", cantidad: 1, precio_venta_unitario: 0 }
    ]);
  }

  function removeItem(id: string) {
    if (items.length > 1) {
      setItems(prev => prev.filter(i => i.uiId !== id));
    }
  }

  function updateItem(id: string, field: keyof VentaItemUI, value: any) {
    setItems(prev => prev.map(item => {
      if (item.uiId === id) {
        const newItem = { ...item, [field]: value };
        
        // Auto-completar SKU cuando se selecciona el modelo del selector
        if (field === "modelo") {
          const selectedStock = stockDisponible.find(s => s.modelo === value);
          if (selectedStock) {
            newItem.sku = selectedStock.sku || "";
          }
        }
        return newItem;
      }
      return item;
    }));
  }

  const totalVenta = items.reduce((acc, item) => acc + (item.cantidad * (Number(item.precio_venta_unitario) || 0)), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validación básica en UI
    for (const item of items) {
      if (!item.modelo) {
        setError("Todos los ítems deben tener un producto seleccionado.");
        return;
      }
      const stockInfo = stockDisponible.find(s => s.modelo === item.modelo && s.sku === item.sku);
      if (!stockInfo || item.cantidad > stockInfo.cantidad_disponible) {
        setError(`No hay suficiente stock para ${item.modelo}. Disponible: ${stockInfo?.cantidad_disponible || 0}`);
        return;
      }
    }

    setEnviando(true);
    const result = await crearVenta(clienteId || null, notas, items, usarSaldo ? saldoADescontar : 0);
    
    if (result.error) {
      setError(result.error);
      setEnviando(false);
    } else {
      router.push("/ventas");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in pb-12">
      {error && (
        <div className="rounded-md bg-red-900/50 p-4 border border-red-500/50 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader title="1. Datos Generales" />
        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Cliente / Técnico (Opcional)</label>
              <select 
                className="w-full h-10 bg-slate-950 border border-slate-800 rounded-md px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">Consumidor Final (Sin registrar)</option>
                {clientes.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    [#{String(cli.numero_cliente).padStart(4, '0')}] {cli.nombre_local}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Notas / Referencia (Opcional)">
              <Input
                placeholder="Ej: Entregado por mensajería"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader 
          title="2. Productos a vender"
          action={
            <div className="text-right flex items-center justify-end gap-6">
              {usarSaldo && saldoADescontar > 0 && (
                <div className="text-right">
                  <span className="text-sm text-slate-400 block">A cobrar</span>
                  <span className="text-2xl font-bold text-emerald-400">{formatUSD(Math.max(0, totalVenta - saldoADescontar))}</span>
                </div>
              )}
              <div className="text-right">
                <span className="text-sm text-slate-400 block">Total de la venta</span>
                <span className={`text-2xl font-bold ${usarSaldo && saldoADescontar > 0 ? 'text-slate-300 line-through text-xl' : 'text-emerald-400'}`}>
                  {formatUSD(totalVenta)}
                </span>
              </div>
            </div>
          }
        />
        <div className="space-y-4 px-5 pb-5">
          {items.map((item, index) => {
            const stockInfo = stockDisponible.find(s => s.modelo === item.modelo);
            const stockSuficiente = stockInfo ? stockInfo.cantidad_disponible >= item.cantidad : true;

            return (
              <div key={item.uiId} className="flex flex-col md:flex-row gap-4 items-start bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                <div className="w-full md:w-2/5 space-y-1">
                  <label className="text-xs font-medium text-slate-400">Producto (En Stock)</label>
                  <select 
                    className="w-full h-10 bg-slate-950 border border-slate-800 rounded-md px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
                    value={item.modelo}
                    onChange={(e) => updateItem(item.uiId, "modelo", e.target.value)}
                    required
                  >
                    <option value="">Selecciona un producto...</option>
                    {stockDisponible.map((stock) => (
                      <option key={`${stock.sku}-${stock.modelo}`} value={stock.modelo}>
                        {stock.sku ? `[${stock.sku}] ` : ""}{stock.modelo} ({stock.cantidad_disponible} disp.)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-1/5 space-y-1">
                  <label className="text-xs font-medium text-slate-400">Cantidad</label>
                  <Input 
                    type="number"
                    min="1"
                    required
                    value={item.cantidad || ""}
                    onChange={(e) => updateItem(item.uiId, "cantidad", parseInt(e.target.value))}
                    className={!stockSuficiente ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50" : ""}
                  />
                  {!stockSuficiente && (
                    <p className="text-xs text-red-400 mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Supera el stock
                    </p>
                  )}
                </div>

                <div className="w-full md:w-1/5 space-y-1">
                  <label className="text-xs font-medium text-slate-400">Precio Venta (USD)</label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={item.precio_venta_unitario || ""}
                    onChange={(e) => updateItem(item.uiId, "precio_venta_unitario", parseFloat(e.target.value))}
                  />
                </div>

                <div className="w-full md:w-1/5 space-y-1">
                  <label className="text-xs font-medium text-slate-400">Subtotal</label>
                  <div className="h-10 flex items-center px-3 bg-slate-900 rounded-md border border-slate-800 text-white font-medium">
                    {formatUSD(item.cantidad * (Number(item.precio_venta_unitario) || 0))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.uiId)}
                  disabled={items.length === 1}
                  className="mt-6 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}

          <Button
            type="button"
            variant="secondary"
            onClick={addItem}
            className="w-full mt-4 border-dashed border-slate-700 text-slate-400 hover:text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir otro producto
          </Button>
        </div>
      </Card>

      {clienteSeleccionado && saldoDisponible > 0 && (
        <Card className="border-copper/30 bg-copper/5">
          <div className="p-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-copper flex items-center gap-2">
                Saldo a favor disponible: ${Number(saldoDisponible).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Puedes usar este saldo para descontar del total de la venta actual.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-copper focus:ring-copper focus:ring-offset-slate-950"
                  checked={usarSaldo}
                  onChange={(e) => {
                    setUsarSaldo(e.target.checked);
                    if (e.target.checked) {
                      setSaldoADescontar(Math.min(totalVenta, saldoDisponible));
                    } else {
                      setSaldoADescontar(0);
                    }
                  }}
                />
                Usar saldo a favor
              </label>

              {usarSaldo && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-400">$</span>
                  <Input 
                    type="number"
                    min="0"
                    max={Math.min(totalVenta, saldoDisponible)}
                    step="0.01"
                    className="w-32 bg-slate-900"
                    value={saldoADescontar || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSaldoADescontar(Math.min(val, totalVenta, saldoDisponible));
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => router.push("/ventas")}
          disabled={enviando}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          disabled={enviando}
        >
          {enviando ? "Procesando venta..." : "Confirmar Venta y Descontar Stock"}
        </Button>
      </div>
      <p className="text-xs text-slate-500 flex items-center mt-4">
        <Info className="h-3 w-3 mr-1" />
        El sistema asignará el costo real descontando las unidades de la importación más antigua (FIFO).
      </p>
    </form>
  );
}
