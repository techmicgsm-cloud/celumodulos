import { NuevaImportacionForm } from "@/components/forms/NuevaImportacionForm";

export default function NuevaImportacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary tracking-tight">
          Nueva importación
        </h1>
        <p className="text-sm text-text-muted mt-0.5">
          Cargá la factura, los totales y los modelos para calcular el costo
          real y los precios sugeridos.
        </p>
      </div>
      <NuevaImportacionForm />
    </div>
  );
}
