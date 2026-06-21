"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, AlertTriangle, CheckCircle, PackageX, User, Calendar } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatARS } from "@/lib/calculations";
import { buscarVentasPorFiltro, procesarDevolucion } from "./actions";

export default function NuevaDevolucionPage() {
  const router = useRouter();
  const [filtro, setFiltro] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any | null>(null);
  const [itemSeleccionado, setItemSeleccionado] = useState<any | null>(null);
  
  const [cantidad, setCantidad] = useState(1);
  const [estado, setEstado] = useState<"bueno" | "fallado">("fallado");
  const [procesando, setProcesando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!filtro) return;
    // Permitir búsquedas cortas si es un número (para IDs de cliente como "1" o "12")
    if (isNaN(Number(filtro)) && filtro.length < 3) return;
    
    setBuscando(true);
    setVentaSeleccionada(null);
    setItemSeleccionado(null);
    const ventas = await buscarVentasPorFiltro(filtro);
    setResultados(ventas);
    setBuscando(false);
  }

  async function handleProcesar() {
    if (!ventaSeleccionada || !itemSeleccionado) return;
    if (cantidad < 1 || cantidad > itemSeleccionado.cantidad) {
      setError(`La cantidad debe ser entre 1 y ${itemSeleccionado.cantidad}`);
      return;
    }

    setProcesando(true);
    setError(null);
    
    // Proporción de la devolución sobre el total cobrado
    // O directamente precio_unitario_venta * cantidad
    const montoAcreditar = itemSeleccionado.precio_unitario_venta * cantidad;

    const result = await procesarDevolucion(
      itemSeleccionado.id,
      cantidad,
      estado,
      montoAcreditar,
      ventaSeleccionada.id,
      ventaSeleccionada.cliente_id
    );

    if (result.error) {
      setError(result.error);
    } else {
      setExito(true);
    }
    setProcesando(false);
  }

  if (exito) {
    return (
      <Card className="max-w-xl mx-auto border-emerald-500/30 bg-emerald-500/5 animate-fade-in text-center p-12">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Devolución Procesada</h2>
        <p className="text-slate-400 mb-8">
          El artículo ha sido procesado correctamente.
          {ventaSeleccionada?.cliente_id && " Se acreditó saldo a favor en la cuenta del cliente."}
        </p>
        <Button onClick={() => router.push("/devoluciones")} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          Ir al listado de RMAs
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <RotateCcw className="h-8 w-8 text-amber-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Nueva Devolución</h1>
          <p className="text-slate-400 mt-1">Busca el ticket o cliente para iniciar un RMA.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-900/50 p-4 border border-red-500/50 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {!ventaSeleccionada ? (
        <Card className="p-6">
          <form onSubmit={handleBuscar} className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-400 mb-1 block">Buscar por ID de Ticket o Número de Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Ej: F3A82337 o '0002'" 
                  className="pl-10"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={buscando} className="bg-slate-800 hover:bg-slate-700">
                {buscando ? "Buscando..." : "Buscar Venta"}
              </Button>
            </div>
          </form>

          {resultados.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-medium text-slate-300">Resultados encontrados:</h3>
              <div className="grid gap-4">
                {resultados.map(venta => (
                  <div 
                    key={venta.id} 
                    className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer flex items-center justify-between"
                    onClick={() => setVentaSeleccionada(venta)}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">
                          #{venta.id.split('-')[0].toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(venta.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="font-medium text-white flex items-center gap-1">
                        <User className="w-4 h-4 text-slate-500" />
                        {venta.cliente?.nombre_local || venta.cliente_nombre || "Consumidor Final"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{formatARS(venta.total_venta)}</div>
                      <div className="text-xs text-slate-500">{venta.items?.length || 0} artículos</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultados.length === 0 && !buscando && filtro !== "" && (
            <div className="mt-6 text-center text-slate-500 text-sm">
              No se encontraron ventas para esta búsqueda.
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">
                  Venta #{ventaSeleccionada.id.split('-')[0].toUpperCase()}
                </h2>
                <p className="text-sm text-slate-400">
                  Cliente: {ventaSeleccionada.cliente?.nombre_local || "Consumidor Final"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setVentaSeleccionada(null)}>
                Cambiar Venta
              </Button>
            </div>

            <h3 className="text-sm font-medium text-slate-300 mb-4">Selecciona el artículo a devolver:</h3>
            <div className="grid gap-4">
              {ventaSeleccionada.items?.map((item: any) => (
                <div 
                  key={item.id}
                  onClick={() => setItemSeleccionado(item)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                    itemSeleccionado?.id === item.id 
                      ? 'border-amber-500 bg-amber-500/10' 
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium text-white">{item.modelo}</div>
                    <div className="text-sm text-slate-400">
                      Vendido: {item.cantidad} u. a {formatARS(item.precio_unitario_venta)} c/u
                    </div>
                  </div>
                  {itemSeleccionado?.id === item.id && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-950" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {itemSeleccionado && (
            <Card className="p-6 animate-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-white mb-6">Detalles de la Devolución</h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-2 block">Cantidad a Devolver</label>
                  <Input 
                    type="number"
                    min="1"
                    max={itemSeleccionado.cantidad}
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 mt-1">Máximo: {itemSeleccionado.cantidad}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 mb-2 block">Estado de la Pieza</label>
                  <select 
                    className="w-full h-10 bg-slate-950 border border-slate-800 rounded-md px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as "bueno" | "fallado")}
                  >
                    <option value="fallado">Fallado (Garantía - Pérdida)</option>
                    <option value="bueno">Bueno (Devolución - Vuelve al Stock)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {estado === 'bueno' ? 'Volverá al inventario disponible.' : 'Se declarará como pérdida.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-400">Total a acreditar</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {formatARS(itemSeleccionado.precio_unitario_venta * cantidad)}
                  </div>
                  {ventaSeleccionada.cliente_id ? (
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      Se acreditará a la cuenta corriente del cliente.
                    </div>
                  ) : (
                    <div className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Consumidor Final: deberás devolver el dinero manualmente.
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleProcesar} 
                  disabled={procesando}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                >
                  {procesando ? "Procesando..." : "Confirmar RMA"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
