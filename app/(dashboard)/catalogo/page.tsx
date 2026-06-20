import { LayoutGrid } from "lucide-react";
import { obtenerCatalogoAgrupado, obtenerConfiguracionAdmin } from "@/lib/data";
import { CatalogoAdminClient } from "@/components/catalogo/CatalogoAdminClient";
import { createClient } from "@/lib/supabase/server";

export default async function CatalogoAdminPage() {
  const catalogo = await obtenerCatalogoAgrupado();
  const config = await obtenerConfiguracionAdmin();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <LayoutGrid className="h-8 w-8 text-copper" />
            Catálogo de Stock
          </h1>
          <p className="text-slate-400 mt-1">
            Administra las fotos y el margen público de tu inventario.
          </p>
        </div>
      </div>

      <CatalogoAdminClient 
        catalogo={catalogo} 
        margenDefecto={config?.margen_publico_defecto || 40} 
        userId={user?.id || ""}
      />
    </div>
  );
}
