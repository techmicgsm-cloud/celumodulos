"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, UserPlus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { crearCliente } from "@/app/(dashboard)/clientes/nuevo/actions";

export function NuevoClienteForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await crearCliente(formData);
    
    if (result.error) {
      setError(result.error);
      setEnviando(false);
    } else {
      router.push("/clientes");
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
        <CardHeader title="Información del Cliente o Técnico" />
        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Nombre o Local" required>
              <Input
                name="nombre_local"
                placeholder="Ej: Celulares Juan / Técnico Juan"
                required
              />
            </Field>
            
            <Field label="Teléfono (Opcional)">
              <Input
                name="telefono"
                placeholder="Ej: 11 1234-5678"
                type="tel"
              />
            </Field>

            <Field label="Email (Opcional)">
              <Input
                name="email"
                placeholder="Ej: juan@celulares.com"
                type="email"
              />
            </Field>

            <Field label="Dirección / Zona (Opcional)">
              <Input
                name="direccion"
                placeholder="Ej: Av. Rivadavia 1234, CABA"
              />
            </Field>
          </div>

          <Field label="Notas / Descuentos acordados (Opcional)">
            <textarea
              name="notas"
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-copper focus:border-copper"
              placeholder="Ej: Lleva más de 5 módulos por semana. Se le hace un 10% de descuento."
              rows={3}
            />
          </Field>
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => router.push("/clientes")}
          disabled={enviando}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-copper hover:bg-copper-hover text-black font-semibold px-8"
          disabled={enviando}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {enviando ? "Guardando..." : "Guardar Cliente"}
        </Button>
      </div>
    </form>
  );
}
