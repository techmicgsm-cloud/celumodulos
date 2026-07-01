"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registrarPagoCliente } from "../actions";

interface Props {
  clienteId: string;
  clienteNombre: string;
  saldoDeuda: number; // Será el valor absoluto de saldo_actual si es negativo
}

export function RegistrarPagoModal({ clienteId, clienteNombre, saldoDeuda }: Props) {
  const [open, setOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [monto, setMonto] = useState(saldoDeuda.toString());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await registrarPagoCliente(clienteId, formData, clienteNombre);
    
    setCargando(false);
    if (result.error) {
      alert(result.error);
    } else {
      setOpen(false);
    }
  }

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
      >
        <Plus className="w-4 h-4 mr-2" />
        Registrar Pago
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Registrar Pago de Deuda</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <p className="text-sm text-slate-400 mb-1">Deuda actual del cliente:</p>
                <p className="text-xl font-bold text-red-400">${saldoDeuda.toLocaleString("es-AR", {minimumFractionDigits: 2})}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Monto a pagar ($)</label>
                <Input 
                  name="monto" 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
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
                <label className="text-xs font-medium text-slate-400 block mb-1">Notas (Opcional)</label>
                <Input 
                  name="notas" 
                  type="text" 
                  placeholder="Ej: Saldo total pagado, Adelanto..." 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold" disabled={cargando}>
                  {cargando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Confirmar Pago
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
