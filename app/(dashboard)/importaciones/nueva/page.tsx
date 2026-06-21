import { ImportacionForm } from "@/components/forms/ImportacionForm";

export default function NuevaImportacionPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Nueva Importación
        </h1>
        <p className="text-slate-400 mt-1">
          Registrá los modelos ingresados y los gastos totales para calcular el costo real de cada unidad.
        </p>
      </div>

      <ImportacionForm />
    </div>
  );
}
