import { Wallet, TrendingUp, TrendingDown, RefreshCcw, DollarSign } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatARS } from "@/lib/calculations";
import { obtenerResumenCajaDia } from "./actions";
import { NuevoMovimientoModal } from "./NuevoMovimientoModal";

export default async function CajaPage() {
  const { ventas, devoluciones, movimientos } = await obtenerResumenCajaDia();

  // Calcular totales
  let totalEfectivoIngresos = 0;
  let totalEfectivoEgresos = 0;
  let totalTransferenciasIngresos = 0;
  let totalTransferenciasEgresos = 0;

  // Lista unificada para la tabla
  const lineaTiempo: any[] = [];

  // Procesar Ventas
  ventas.forEach((v: any) => {
    if (v.metodo_pago === 'efectivo') totalEfectivoIngresos += v.total_venta;
    if (v.metodo_pago === 'transferencia') totalTransferenciasIngresos += v.total_venta;
    
    // Ignoramos cuenta corriente en caja, porque no mueve dinero hoy.
    if (v.metodo_pago !== 'cuenta_corriente') {
      lineaTiempo.push({
        id: v.id,
        created_at: v.created_at,
        tipo: 'ingreso',
        concepto: `Venta #${v.id.split('-')[0].toUpperCase()} - ${v.cliente?.nombre_local || v.cliente_nombre || 'Consumidor Final'}`,
        monto: v.total_venta,
        metodo_pago: v.metodo_pago
      });
    }
  });

  // Procesar Devoluciones
  devoluciones.forEach((d: any) => {
    // Si la venta original no tenía cliente, asumimos que se devuelve efectivo.
    if (!d.venta_item?.venta?.cliente_id) {
      totalEfectivoEgresos += d.monto_acreditado;
      lineaTiempo.push({
        id: d.id,
        created_at: d.created_at,
        tipo: 'egreso',
        concepto: `Devolución Efectivo (Consumidor Final) - RMA #${d.id.split('-')[0].toUpperCase()}`,
        monto: d.monto_acreditado,
        metodo_pago: 'efectivo'
      });
    }
  });

  // Procesar Movimientos Manuales
  movimientos.forEach((m: any) => {
    if (m.tipo === 'ingreso') {
      if (m.metodo_pago === 'efectivo') totalEfectivoIngresos += m.monto;
      if (m.metodo_pago === 'transferencia') totalTransferenciasIngresos += m.monto;
    } else {
      if (m.metodo_pago === 'efectivo') totalEfectivoEgresos += m.monto;
      if (m.metodo_pago === 'transferencia') totalTransferenciasEgresos += m.monto;
    }

    lineaTiempo.push({
      id: m.id,
      created_at: m.created_at,
      tipo: m.tipo,
      concepto: m.concepto,
      monto: m.monto,
      metodo_pago: m.metodo_pago
    });
  });

  // Ordenar línea de tiempo (más recientes primero)
  lineaTiempo.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const balanceEfectivo = totalEfectivoIngresos - totalEfectivoEgresos;
  const balanceTransferencias = totalTransferenciasIngresos - totalTransferenciasEgresos;
  const balanceTotal = balanceEfectivo + balanceTransferencias;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wallet className="h-8 w-8 text-copper" />
            Caja Diaria
          </h1>
          <p className="text-slate-400 mt-1">
            Control de ingresos y egresos del día en curso.
          </p>
        </div>
        <NuevoMovimientoModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-emerald-500/10 border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Efectivo Hoy</p>
              <p className="text-2xl font-bold text-emerald-400">{formatARS(balanceEfectivo)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <RefreshCcw className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Transferencias</p>
              <p className="text-2xl font-bold text-blue-400">{formatARS(balanceTransferencias)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-amber-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Balance General</p>
              <p className="text-2xl font-bold text-white">{formatARS(balanceTotal)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Movimientos del Día" />
        <div className="overflow-x-auto">
          {lineaTiempo.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No hay movimientos registrados en el día de hoy.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-y border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Hora</th>
                  <th className="px-6 py-3 font-semibold">Concepto</th>
                  <th className="px-6 py-3 font-semibold text-center">Método</th>
                  <th className="px-6 py-3 font-semibold text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {lineaTiempo.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      {new Intl.DateTimeFormat("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(mov.created_at))}
                    </td>
                    <td className="px-6 py-4 text-white">
                      <div className="flex items-center gap-2">
                        {mov.tipo === 'ingreso' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        {mov.concepto}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-slate-700 bg-slate-800 text-slate-300 capitalize">
                        {mov.metodo_pago}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right whitespace-nowrap font-mono font-medium ${
                      mov.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {mov.tipo === 'ingreso' ? '+' : '-'}{formatARS(mov.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
