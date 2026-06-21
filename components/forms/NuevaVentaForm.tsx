"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertTriangle, Info, CheckCircle, FileText, ArrowRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatUSD, formatARS } from "@/lib/calculations";
import { crearVenta, VentaItemInput } from "@/app/(dashboard)/ventas/nueva/actions";
import { StockAgrupado, Cliente } from "@/lib/types";
import { exportarTicketVentaPdf } from "@/lib/export-pdf";

interface VentaItemUI extends VentaItemInput {
  uiId: string;
}

export function NuevaVentaForm({ 
  stockDisponible, 
  clientes,
  ultimoFactorDolar
}: { 
  stockDisponible: StockAgrupado[],
  clientes: Cliente[],
  ultimoFactorDolar: number
}) {
  const router = useRouter();
  const [cargandoDolar, setCargandoDolar] = useState(true);
  const [errorDolar, setErrorDolar] = useState<string | null>(null);


  useEffect(() => {
    async function fetchDolarBlue() {
      try {
        const res = await fetch("https://dolarapi.com/v1/dolares/blue");
        if (!res.ok) throw new Error("No se pudo obtener la cotización");
        const data = await res.json();
        setValorDolar(data.venta || 1300);
      } catch (err) {
        console.error(err);
        setErrorDolar("No se pudo cargar el dólar automático.");
      } finally {
        setCargandoDolar(false);
      }
    }
    fetchDolarBlue();
  }, []);

  const [clienteId, setClienteId] = useState("");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [valorDolar, setValorDolar] = useState(ultimoFactorDolar);
  
  const [usarSaldo, setUsarSaldo] = useState(false);
  const [saldoADescontar, setSaldoADescontar] = useState(0);
  
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState<{ id: string, total: number, items: any[] } | null>(null);

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
        
        // Auto-completar SKU y Precio Sugerido cuando se selecciona el modelo
        if (field === "modelo") {
          const selectedStock = stockDisponible.find(s => s.modelo === value);
          if (selectedStock) {
            newItem.sku = selectedStock.sku || "";
            newItem.precio_venta_unitario = selectedStock.precio_sugerido || 0;
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
    const result = await crearVenta(clienteId || null, notas, items, usarSaldo ? saldoADescontar : 0, metodoPago);
    
    if (result.error) {
      setError(result.error);
      setEnviando(false);
    } else {
      setVentaExitosa({
        id: result.ventaId,
        total: totalVenta,
        items: items
      });
      setEnviando(false);
    }
  }

  if (ventaExitosa) {
    return (
      <Card className="max-w-2xl mx-auto border-emerald-500/30 bg-emerald-500/5 animate-fade-in text-center p-12">
        <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-2">¡Venta Registrada!</h2>
        <p className="text-slate-400 mb-8">
          La venta se ha procesado exitosamente y el stock ha sido descontado.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            onClick={() => {
              exportarTicketVentaPdf(
                { id: ventaExitosa.id, created_at: new Date().toISOString(), metodo_pago: metodoPago, total_venta: ventaExitosa.total, notas },
                ventaExitosa.items,
                clienteSeleccionado,
                valorDolar
              );
            }}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white"
          >
            <FileText className="mr-2 h-4 w-4" />
            Imprimir Comprobante PDF
          </Button>
          <Button 
            onClick={() => router.push("/ventas")}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Ir al listado de Ventas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
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
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Método de Pago</label>
              <select 
                className="w-full h-10 bg-slate-950 border border-slate-800 rounded-md px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cuenta_corriente">Fiado (Cuenta Corriente)</option>
              </select>
            </div>
            
            <Field label="Cotización Dólar (ARS) del Día">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">$</span>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={valorDolar}
                    onChange={(e) => setValorDolar(parseFloat(e.target.value) || 0)}
                    disabled={cargandoDolar}
                    className={cargandoDolar ? "opacity-50" : ""}
                  />
                  {cargandoDolar && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-copper animate-pulse">
                      Cargando Dólar Blue...
                    </div>
                  )}
                </div>
              </div>
              {errorDolar && <p className="text-xs text-red-400 mt-1">{errorDolar}</p>}
            </Field>

            <Field label="Notas / Referencia (Opcional)">
              <Input
                placeholder="Ej: Entregado por mensajería"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </Field>
          </div>
          {metodoPago === 'cuenta_corriente' && !clienteSeleccionado && (
            <div className="text-amber-400 text-sm flex items-center mt-2 p-3 bg-amber-400/10 rounded border border-amber-400/20">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              Selecciona un cliente de la agenda para poder fiarle (Cuenta Corriente).
            </div>
          )}
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
                <span className="text-sm font-medium text-emerald-500/80 block mt-1">
                  ≈ {formatARS(totalVenta * valorDolar)}
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
                  <div className="flex flex-col">
                    <div className="h-10 flex items-center px-3 bg-slate-900 rounded-md border border-slate-800 text-white font-medium">
                      {formatUSD(item.cantidad * (Number(item.precio_venta_unitario) || 0))}
                    </div>
                    <span className="text-xs text-emerald-500/80 font-medium mt-1.5 ml-1">
                      ≈ {formatARS(item.cantidad * (Number(item.precio_venta_unitario) || 0) * valorDolar)}
                    </span>
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
          disabled={enviando || (metodoPago === 'cuenta_corriente' && !clienteSeleccionado)}
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
