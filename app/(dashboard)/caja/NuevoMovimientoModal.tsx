"use client";

import { useState } from "react";
import { Plus, X, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registrarMovimientoCaja } from "./actions";

export function NuevoMovimientoModal() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"ingreso" | "egreso">("egreso");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    const formData = new FormData(e.currentTarget);
    formData.append("tipo", tipo);
    
    await registrarMovimientoCaja(formData);
    setCargando(false);
    setOpen(false);
  }

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
      >
        <Plus className="w-4 h-4 mr-2" />
        Registrar Movimiento
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Nuevo Movimiento Manual</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTipo("ingreso")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    tipo === 'ingreso' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" /> Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("egreso")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    tipo === 'egreso' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" /> Egreso
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Monto ($)</label>
                <Input 
                  name="monto" 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  placeholder="Ej: 5000" 
                  required 
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Método de Pago</label>
                <select 
                  name="metodo_pago"
                  className="w-full h-10 bg-slate-950 border border-slate-800 rounded-md px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  required
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria / App</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Concepto / Descripción</label>
                <Input 
                  name="concepto" 
                  type="text" 
                  placeholder="Ej: Pago de flete, Retiro de dinero..." 
                  required 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-bold" disabled={cargando}>
                  {cargando ? "Guardando..." : "Guardar Movimiento"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
