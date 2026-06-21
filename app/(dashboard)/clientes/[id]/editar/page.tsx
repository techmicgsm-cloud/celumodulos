import { notFound } from "next/navigation";
import { User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ClienteForm } from "@/components/forms/ClienteForm";
import { obtenerClientePorId } from "@/lib/data";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await obtenerClientePorId(id);
  
  if (!cliente) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link href={`/clientes/${id}`} className="inline-flex items-center text-sm text-copper hover:text-copper-hover w-fit">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver al Perfil
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <User className="h-8 w-8 text-copper" />
            Editar Cliente
          </h1>
          <p className="text-slate-400 mt-1">
            Modifica los datos de contacto y notas del cliente.
          </p>
        </div>
      </div>

      <ClienteForm initialData={cliente} />
    </div>
  );
}
