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
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-3 bg-bg-panel border border-white/10 rounded-full text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-copper focus:border-transparent transition-all shadow-lg"
          placeholder="Buscar por modelo o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item: any) => (
            <div 
              key={item.modelo} 
              className="bg-bg-panel border border-white/5 rounded-xl overflow-hidden hover:border-copper/30 transition-all duration-300 group flex flex-col"
            >
              <div className="aspect-square bg-slate-900/50 relative p-4 flex items-center justify-center">
                {item.imagen_url ? (
                  <img 
                    src={item.imagen_url} 
                    alt={item.modelo} 
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <Package className="w-12 h-12 text-slate-700 opacity-50" />
                )}
                
                {/* Stock Badge */}
                <div className="absolute top-2 right-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                  {item.cantidad_disponible} en stock
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col justify-between border-t border-white/5 bg-gradient-to-b from-transparent to-bg-recessed/50">
                <div>
                  {item.marca && (
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      {item.marca}
                    </div>
                  )}
                  <h3 className="text-sm font-medium text-slate-200 line-clamp-2 leading-tight">
                    {item.modelo}
                  </h3>
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/5 flex items-end justify-between">
                  <div className="text-xl font-bold text-copper tracking-tight">
                    {formatUSD(item.precio_publico)}
                  </div>
                  {item.sku && (
                    <div className="text-[9px] font-mono text-slate-600">
                      #{item.sku}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-slate-300">No se encontraron resultados</h3>
          <p className="text-slate-500 mt-2">Intenta buscar con otro nombre de modelo o SKU.</p>
        </div>
      )}
    </div>
  );
}
