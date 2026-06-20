import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { obtenerVentaPorId } from "@/lib/data";
import { Card, CardHeader } from "@/components/ui/Card";
import { DevolucionForm } from "./DevolucionForm";

export default async function DevolucionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venta = await obtenerVentaPorId(id);
  
  if (!venta) {
    notFound();
  }

  // Filtrar items que tienen cantidad > 0 (si ya se devolvieron todos, cantidad será 0 en la vista actual, asumiendo la resta en DB)
  // Nota: en nuestro diseño, la RPC resta de la cantidad del item.
  const itemsDisponibles = venta.items.filter((item: any) => item.cantidad > 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col gap-4">
        <Link href="/ventas" className="inline-flex items-center text-sm text-copper hover:text-copper-hover w-fit">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver a Ventas
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <RefreshCcw className="h-8 w-8 text-copper" />
            Cargar Devolución
          </h1>
          <p className="text-slate-400 mt-1">
            Venta #{venta.id.split("-")[0]} a {venta.cliente?.nombre_local || venta.cliente_nombre}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-fit">
          <CardHeader title="Ítems de la Venta" />
          <div className="p-5">
            {itemsDisponibles.length === 0 ? (
              <p className="text-sm text-slate-400">Todos los ítems de esta venta ya han sido devueltos o la venta está vacía.</p>
            ) : (
              <DevolucionForm ventaId={venta.id} items={itemsDisponibles} />
            )}
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Información de Cuenta Corriente" />
          <div className="p-5 text-sm text-slate-300 space-y-4">
            <p>
              Al procesar una devolución, se le acreditará al cliente el valor al que compró originalmente el módulo como <strong>Saldo a favor</strong>.
            </p>
            <p>
              Debes seleccionar si el módulo está <strong>Bueno</strong> o <strong>Fallado</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong className="text-slate-200">Bueno:</strong> El módulo vuelve físicamente al inventario disponible para venderlo de nuevo. La ganancia y costo de esta venta se ajustarán.</li>
              <li><strong className="text-slate-200">Fallado:</strong> El módulo NO vuelve al stock (se asume RMA/Garantía). Se genera el saldo a favor al cliente.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
