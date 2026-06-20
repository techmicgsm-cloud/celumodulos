import { ShoppingCart } from "lucide-react";
import { obtenerStockAgrupado, obtenerClientes } from "@/lib/data";
import { NuevaVentaForm } from "@/components/forms/NuevaVentaForm";

export default async function NuevaVentaPage() {
  const stockDisponible = await obtenerStockAgrupado();
  const clientes = await obtenerClientes();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-copper" />
          Registrar Venta
        </h1>
        <p className="text-slate-400 mt-1">
          Añade los productos a la venta. El stock se descontará automáticamente (FIFO).
        </p>
      </div>

      <NuevaVentaForm stockDisponible={stockDisponible} clientes={clientes} />
    </div>
  );
}
