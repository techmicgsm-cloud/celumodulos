"use client";

import { useState } from "react";
import { Search, Package } from "lucide-react";
import { formatUSD } from "@/lib/calculations";

export function PublicCatalogClient({ catalog }: { catalog: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = catalog.filter((item: any) => 
    item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-10">
      {/* Search Bar - Floating & Glassmorphic */}
      <div className="sticky top-24 z-30 max-w-2xl mx-auto px-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-copper/20 rounded-full blur-xl group-focus-within:bg-copper/30 transition-all duration-500 opacity-50" />
          <div className="relative flex items-center bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl transition-all duration-300 focus-within:border-copper/50 focus-within:ring-1 focus-within:ring-copper/50">
            <div className="pl-6 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-copper/70 group-focus-within:text-copper transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-4 pr-6 py-4 bg-transparent text-white placeholder-slate-400 focus:outline-none transition-all text-base md:text-lg"
              placeholder="Buscar por modelo o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="pr-6 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filtered.map((item: any) => (
            <div 
              key={item.modelo} 
              className="bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-copper/50 hover:shadow-[0_0_25px_rgba(217,119,87,0.15)] hover:-translate-y-1 transition-all duration-300 group flex flex-col"
            >
              <div className="aspect-square bg-gradient-to-b from-slate-800/50 to-slate-900/80 relative p-5 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-copper/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {item.imagen_url ? (
                  <img 
                    src={item.imagen_url} 
                    alt={item.modelo} 
                    className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-500 ease-out drop-shadow-xl z-10" 
                  />
                ) : (
                  <Package className="w-12 h-12 text-slate-700/50 group-hover:text-slate-600 transition-colors z-10" />
                )}
                
                {/* Stock Badge */}
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-lg z-20 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {item.cantidad_disponible} en stock
                </div>
              </div>
              
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between border-t border-white/5 bg-slate-900/50">
                <div>
                  {item.marca && (
                    <div className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-bold mb-1.5 flex items-center gap-2">
                      <span className="w-4 h-[1px] bg-copper/50 block"></span>
                      {item.marca}
                    </div>
                  )}
                  <h3 className="text-sm sm:text-base font-semibold text-slate-100 line-clamp-2 leading-tight group-hover:text-copper/90 transition-colors">
                    {item.modelo}
                  </h3>
                </div>
                
                <div className="mt-5 pt-4 border-t border-white/5 flex items-end justify-between relative">
                  <div className="absolute -top-4 left-0 w-8 h-[1px] bg-gradient-to-r from-copper/50 to-transparent"></div>
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">Precio Unitario</div>
                    <div className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-md">
                      {formatUSD(item.precio_publico)}
                    </div>
                  </div>
                  {item.sku && (
                    <div className="text-[9px] sm:text-[10px] font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md border border-white/5">
                      #{item.sku}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 px-4 bg-slate-900/30 rounded-3xl border border-white/5 backdrop-blur-sm max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 mb-6 border border-white/5 shadow-inner">
            <Search className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-200 mb-2">No se encontraron repuestos</h3>
          <p className="text-slate-400 text-lg">
            No tenemos resultados para "<span className="text-white font-medium">{searchTerm}</span>". <br className="hidden sm:block" />Intenta buscar con otro modelo o número de SKU.
          </p>
          <button 
            onClick={() => setSearchTerm('')}
            className="mt-8 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full font-medium transition-colors border border-white/10"
          >
            Ver catálogo completo
          </button>
        </div>
      )}
    </div>
  );
}
