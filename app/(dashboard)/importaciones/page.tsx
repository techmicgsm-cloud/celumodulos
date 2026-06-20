import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { obtenerImportaciones } from "@/lib/data";
import { Card, CardHeader } from "@/components/ui/Card";
import { ImportacionesTable } from "@/components/importaciones/ImportacionesTable";
import { ExportButtons } from "@/components/importaciones/ExportButtons";

export default async function ImportacionesPage() {
  const importaciones = await obtenerImportaciones();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">
            Historial de importaciones
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Todas las facturas cargadas, con su factor y totales.
          </p>
        </div>
        <Link
          href="/importaciones/nueva"
          className="inline-flex items-center gap-1.5 text-sm bg-copper text-bg-base px-4 py-2 rounded-md font-medium hover:bg-copper-bright transition-colors whitespace-nowrap"
        >
          <PackagePlus size={15} strokeWidth={1.75} />
          Nueva
        </Link>
      </div>

      <Card>
        <CardHeader
          title={`${importaciones.length} importaciones registradas`}
          action={<ExportButtons tipo="historial" importaciones={importaciones} />}
        />
        <ImportacionesTable importaciones={importaciones} />
      </Card>
    </div>
  );
}
