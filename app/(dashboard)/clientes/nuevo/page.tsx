import { UserPlus } from "lucide-react";
import { NuevoClienteForm } from "@/components/forms/NuevoClienteForm";

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <UserPlus className="h-8 w-8 text-copper" />
          Registrar Técnico / Gremio
        </h1>
        <p className="text-slate-400 mt-1">
          Añade un nuevo cliente a tu agenda para vincularlo a futuras ventas.
        </p>
      </div>

      <NuevoClienteForm />
    </div>
  );
}
