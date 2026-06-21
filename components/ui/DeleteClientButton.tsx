"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { eliminarCliente } from "@/app/(dashboard)/clientes/actions";

export function DeleteClientButton({ clienteId }: { clienteId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button 
      type="button" 
      variant="secondary" 
      disabled={isPending}
      className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
      onClick={() => {
        if (confirm("¿Estás seguro de que quieres eliminar a este cliente? Se eliminarán también sus movimientos de cuenta corriente. Las ventas realizadas se mantendrán pero perderán el vínculo con el cliente.")) {
          startTransition(async () => {
            await eliminarCliente(clienteId);
          });
        }
      }}
    >
      {isPending ? "Eliminando..." : "Eliminar"}
    </Button>
  );
}
