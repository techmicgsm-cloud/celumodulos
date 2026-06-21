import { UserPlus } from "lucide-react";
import { ClienteForm } from "@/components/forms/ClienteForm";

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <UserPlus className="h-8 w-8 text-copper" />
          Nuevo Cliente
        </h1>
        <p className="text-slate-400 mt-1">
          Registra un nuevo técnico o local para llevar su cuenta corriente.
        </p>
      </div>

      <ClienteForm />
    </div>
  );
}
