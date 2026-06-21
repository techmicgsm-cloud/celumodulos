"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, UserPlus, Save } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { crearCliente } from "@/app/(dashboard)/clientes/nuevo/actions";
import { actualizarCliente } from "@/app/(dashboard)/clientes/actions";
import { Cliente } from "@/lib/types";

interface ClienteFormProps {
  initialData?: Cliente;
}

export function ClienteForm({ initialData }: ClienteFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  
  const isEditing = !!initialData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    
    const formData = new FormData(e.currentTarget);
    
    let result;
    if (isEditing) {
      result = await actualizarCliente(initialData.id, formData);
    } else {
      result = await crearCliente(formData);
    }
    
    if (result.error) {
      setError(result.error);
      setEnviando(false);
    } else {
      router.push(isEditing ? `/clientes/${initialData.id}` : "/clientes");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl animate-fade-in pb-12">
      {error && (
        <div className="rounded-md bg-red-900/50 p-4 border border-red-500/50 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader title={isEditing ? "Editar Información del Cliente" : "Información del Cliente o Técnico"} />
        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Nombre o Local" required>
              <Input
                name="nombre_local"
                placeholder="Ej: Celulares Juan / Técnico Juan"
                defaultValue={initialData?.nombre_local}
                required
              />
            </Field>
            
            <Field label="Teléfono (Opcional)">
              <Input
                name="telefono"
                placeholder="Ej: 11 1234-5678"
                defaultValue={initialData?.telefono || ""}
                type="tel"
              />
            </Field>

            <Field label="Email (Opcional)">
              <Input
                name="email"
                placeholder="Ej: juan@celulares.com"
                defaultValue={initialData?.email || ""}
                type="email"
              />
            </Field>

            <Field label="Dirección / Zona (Opcional)">
              <Input
                name="direccion"
                placeholder="Ej: Av. Rivadavia 1234, CABA"
                defaultValue={initialData?.direccion || ""}
              />
            </Field>
          </div>

          <Field label="Notas / Descuentos acordados (Opcional)">
            <textarea
              name="notas"
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
              placeholder="Ej: Lleva más de 5 módulos por semana. Se le hace un 10% de descuento."
              defaultValue={initialData?.notas || ""}
              rows={3}
            />
          </Field>
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => router.back()}
          disabled={enviando}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-copper hover:bg-copper-hover text-black font-semibold px-8"
          disabled={enviando}
        >
          {isEditing ? <Save className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
          {enviando ? "Guardando..." : (isEditing ? "Guardar Cambios" : "Guardar Cliente")}
        </Button>
      </div>
    </form>
  );
}
