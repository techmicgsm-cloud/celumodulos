"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Link2, Search, Upload, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CatalogoItem } from "@/lib/types";
import { subirImagenCatalogo, actualizarMargenPublico } from "@/lib/catalogo-actions";
import { formatUSD } from "@/lib/calculations";

export function CatalogoAdminClient({ 
  catalogo, 
  margenDefecto,
  userId
}: { 
  catalogo: CatalogoItem[], 
  margenDefecto: number,
  userId: string 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [margenLocal, setMargenLocal] = useState(margenDefecto);
  const [margenPendiente, setMargenPendiente] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUpdateMargen = () => {
    setMargenPendiente(true);
    const fd = new FormData();
    fd.append("margen", margenLocal.toString());
    startTransition(async () => {
      await actualizarMargenPublico(fd);
      setMargenPendiente(false);
    });
  };

  const handleUploadImage = (modelo: string, file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("modelo", modelo);
    fd.append("image", file);
    
    startTransition(async () => {
      await subirImagenCatalogo(fd);
    });
  };

  const filtered = catalogo.filter(c => 
    c.modelo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.sku && c.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const urlPublica = typeof window !== 'undefined' ? `${window.location.origin}/c/${userId}` : '';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Configuración Catálogo Público" />
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-400">
              Tus clientes no verán tus costos. Los precios que vean en el catálogo público se calcularán automáticamente sumando este porcentaje de ganancia a tu costo real promedio.
            </p>
            <div className="flex gap-4 items-end">
              <Field label="Margen Público Sugerido (%)">
                <Input 
                  type="number" 
                  step="0.1"
                  value={margenLocal} 
                  onChange={e => setMargenLocal(parseFloat(e.target.value) || 0)} 
                />
              </Field>
              <Button 
                onClick={handleUpdateMargen} 
                disabled={margenPendiente || margenLocal === margenDefecto}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-10"
              >
                {margenPendiente ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-copper/5 border-copper/30">
          <CardHeader title="Link Público" />
          <div className="p-5 flex flex-col justify-center h-[calc(100%-60px)]">
            <p className="text-sm text-slate-300 mb-4">
              Comparte este enlace con tus clientes técnicos o gremio para que vean el stock y precios en tiempo real.
            </p>
            <div className="flex bg-slate-900 border border-slate-700 rounded-md overflow-hidden">
              <div className="px-4 py-3 text-sm text-slate-400 flex-1 truncate font-mono select-all">
                {urlPublica}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(urlPublica)}
                className="px-4 bg-copper/20 text-copper hover:bg-copper/30 font-medium text-sm flex items-center transition-colors"
              >
                <Link2 className="w-4 h-4 mr-2" />
                Copiar
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <Search className="text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar modelo o SKU..." 
            className="bg-transparent border-none outline-none text-white w-full text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-y border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Foto</th>
                <th className="px-6 py-3 font-semibold">Modelo</th>
                <th className="px-6 py-3 font-semibold text-center">Stock</th>
                <th className="px-6 py-3 font-semibold text-right">Costo Promedio</th>
                <th className="px-6 py-3 font-semibold text-right">Precio Público (+{margenLocal}%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map(item => {
                const precioPublico = item.costo_real_unitario_promedio * (1 + margenLocal / 100);
                return (
                  <tr key={item.modelo} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="relative w-16 h-16 rounded bg-slate-900 border border-slate-700 overflow-hidden group flex items-center justify-center">
                        {item.imagen_url ? (
                          <img src={item.imagen_url} alt={item.modelo} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-xs text-slate-500 text-center px-1">Sin foto</span>
                        )}
                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={e => handleUploadImage(item.modelo, e.target.files?.[0] || null)}
                            disabled={isPending}
                          />
                          <Upload className="w-5 h-5 text-white" />
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {item.marca} {item.modelo}
                      <div className="text-xs text-slate-500 font-mono mt-1">{item.sku || "Sin SKU"}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                        {item.cantidad_disponible} u.
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-slate-400">
                      {formatUSD(item.costo_real_unitario_promedio)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-emerald-400 font-bold">
                      {formatUSD(precioPublico)}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No se encontraron modelos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
