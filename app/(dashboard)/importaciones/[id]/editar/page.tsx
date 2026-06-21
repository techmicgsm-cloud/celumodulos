import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ImportacionForm } from "@/components/forms/ImportacionForm";

export default async function EditarImportacionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: importacion } = await supabase
    .from("importaciones")
    .select(`
      *,
      items:importacion_items(*)
    `)
    .eq("id", params.id)
    .single();

  if (!importacion) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Editar Importación
        </h1>
        <p className="text-slate-400 mt-1">
          Modificá los datos generales o los modelos ingresados. Tené en cuenta que no podrás reducir cantidades de productos que ya fueron vendidos.
        </p>
      </div>

      <ImportacionForm importacionId={importacion.id} initialData={importacion} />
    </div>
  );
}
