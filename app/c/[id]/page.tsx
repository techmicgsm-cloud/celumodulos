import { Cpu, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PublicCatalogClient } from "@/components/catalogo/PublicCatalogClient";

export default async function PublicCatalogPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id: userId } = await params;

  // Llamar al RPC público (security definer) para obtener el catálogo formateado
  const { data, error } = await supabase.rpc("get_public_catalog", {
    p_user_id: userId,
  });

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg-app text-white flex items-center justify-center p-6">
        <div className="text-center">
          <Cpu className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Catálogo no encontrado</h1>
          <p className="text-slate-400">El catálogo solicitado no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  // Parsear json en caso de ser necesario
  const catalog = typeof data === "string" ? JSON.parse(data) : data;

  return (
    <div className="min-h-screen bg-bg-app text-white">
      {/* Header Público */}
      <header className="sticky top-0 z-10 bg-bg-panel border-b border-white/5 shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-copper/10 text-copper border border-copper/20">
              <Cpu size={18} strokeWidth={2} />
            </div>
            <span className="font-bold tracking-tight text-lg">Catálogo de Repuestos</span>
          </div>
          <div className="text-xs text-slate-400 instrument-label">
            {catalog.length} modelos en stock
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <PublicCatalogClient catalog={catalog} />
      </main>
    </div>
  );
}
