"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exportarTicketVentaPdf } from "@/lib/export-pdf";

interface Props {
  ventaId: string;
}

export function BotonImprimirTicket({ ventaId }: Props) {
  const [cargando, setCargando] = useState(false);

  async function handleImprimir() {
    setCargando(true);
    try {
      // Necesitamos fetchear la venta completa con items para el PDF
      // Como no pasamos una server action directamente, podemos usar fetch o una server action
      // Haremos un fetch a un route handler temporal si no tenemos action, pero como lib/data no es API
      // Vamos a usar una Server Action que debemos crear en la pagina o un archivo action
      const { getVentaParaTicket } = await import("@/app/(dashboard)/ventas/actions");
      const ventaCompleta = await getVentaParaTicket(ventaId);
      
      if (ventaCompleta) {
        exportarTicketVentaPdf(
          ventaCompleta,
          ventaCompleta.items,
          ventaCompleta.cliente
        );
      } else {
        alert("No se pudo obtener la información de la venta.");
      }
    } catch (error) {
      console.error(error);
      alert("Error al intentar imprimir el ticket.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleImprimir}
      disabled={cargando}
      className="text-slate-400 hover:text-white"
    >
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
    </Button>
  );
}
