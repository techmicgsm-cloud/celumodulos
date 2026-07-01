import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail, MapPin, Wallet, Calendar, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { obtenerClientePorId, obtenerMovimientosCC } from "@/lib/data";
import { DeleteClientButton } from "@/components/ui/DeleteClientButton";
import { RegistrarPagoModal } from "./RegistrarPagoModal";

export default async function ClienteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await obtenerClientePorId(id);
  
  if (!cliente) {
    notFound();
  }

  const movimientos = await obtenerMovimientosCC(cliente.id);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col gap-4">
        <Link href="/clientes" className="inline-flex items-center text-sm text-copper hover:text-copper-hover w-fit">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver a Clientes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <User className="h-8 w-8 text-copper" />
              {cliente.nombre_local}
            </h1>
            <p className="text-slate-400 mt-1">
              Perfil del cliente y estado de cuenta corriente.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/clientes/${cliente.id}/editar`}>
              <Button variant="secondary" className="border-slate-800">
                Editar
              </Button>
            </Link>
            <DeleteClientButton clienteId={cliente.id} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader title="Información de Contacto" />
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Nº Cliente</p>
                <p className="text-sm text-white font-mono">{String(cliente.numero_cliente).padStart(4, '0')}</p>
              </div>
            </div>
            
            {cliente.telefono && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Teléfono</p>
                  <p className="text-sm text-white">{cliente.telefono}</p>
                </div>
              </div>
            )}
            
            {cliente.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Email</p>
                  <p className="text-sm text-white break-all">{cliente.email}</p>
                </div>
              </div>
            )}
            
            {cliente.direccion && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Dirección</p>
                  <p className="text-sm text-white">{cliente.direccion}</p>
                </div>
              </div>
            )}

            {cliente.notas && (
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 font-medium mb-1">Notas</p>
                <p className="text-sm text-slate-300 italic">{cliente.notas}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-copper" />
                  {cliente.saldo_actual < 0 ? 'Deuda actual' : 'Saldo a favor actual'}
                </p>
                <h2 className={`text-4xl font-bold font-mono tracking-tight ${cliente.saldo_actual > 0 ? 'text-green-400' : cliente.saldo_actual < 0 ? 'text-red-400' : 'text-white'}`}>
                  ${Math.abs(Number(cliente.saldo_actual)).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </h2>
              </div>
              
              {cliente.saldo_actual < 0 && (
                <RegistrarPagoModal 
                  clienteId={cliente.id} 
                  clienteNombre={cliente.nombre_local} 
                  saldoDeuda={Math.abs(Number(cliente.saldo_actual))} 
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Movimientos de Cuenta Corriente" />
            <div className="overflow-x-auto">
              {movimientos.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No hay movimientos registrados para este cliente.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-y border-slate-800">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Fecha</th>
                      <th className="px-6 py-3 font-semibold">Concepto</th>
                      <th className="px-6 py-3 font-semibold text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {movimientos.map((mov) => {
                      const isPositive = Number(mov.monto) > 0;
                      return (
                        <tr key={mov.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              {new Intl.DateTimeFormat('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }).format(new Date(mov.created_at))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-200">
                            {mov.concepto}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className={`inline-flex items-center gap-1 font-mono font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              ${Math.abs(Number(mov.monto)).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
