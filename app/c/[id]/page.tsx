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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-lg bg-slate-900/50 backdrop-blur-md p-10 rounded-3xl border border-white/5 shadow-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 mb-6 shadow-inner">
            <Cpu className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black mb-3 text-white tracking-tight">Catálogo no encontrado</h1>
          <p className="text-slate-400 text-lg mb-8">El catálogo solicitado no existe, el enlace es incorrecto o no está disponible temporalmente.</p>
          
          {(error || !data) && (
            <div className="mt-4 p-4 bg-black/40 rounded-xl text-left border border-white/5 overflow-auto max-h-60 text-xs font-mono text-slate-300">
              <p className="text-red-400 font-bold mb-2">Detalles del Error (Debug):</p>
              {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
              {!data && !error && <p>La función RPC no devolvió datos (data es null o undefined).</p>}
              <p className="mt-2 text-slate-500">ID Solicitado: {userId}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Parsear json en caso de ser necesario
  const catalog = typeof data === "string" ? JSON.parse(data) : data;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-copper/30 font-sans">
      {/* Decorative background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-copper/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Header Público */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-copper/20 to-copper/5 text-copper border border-copper/20 shadow-[0_0_15px_rgba(217,119,87,0.15)]">
                <Cpu size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-extrabold tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Catálogo de Repuestos
                </h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide">Actualizado en tiempo real</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">
                {catalog.length} {catalog.length === 1 ? 'modelo' : 'modelos'} en stock
              </span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-12 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">
            Encuentra el repuesto <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-copper to-amber-500">
              que necesitas hoy.
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Explora nuestro inventario en tiempo real. Precios actualizados y stock garantizado para profesionales.
          </p>
        </section>

        {/* Contenido Principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <PublicCatalogClient catalog={catalog} />
        </main>
      </div>
    </div>
  );
}
