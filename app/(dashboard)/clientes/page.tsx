import Link from "next/link";
import { Plus, Users, Search, Phone, Mail, MapPin, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { obtenerClientes } from "@/lib/data";

export default async function ClientesPage() {
  const clientes = await obtenerClientes();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-8 w-8 text-copper" />
            Clientes (Técnicos / Gremios)
          </h1>
          <p className="text-slate-400 mt-1">
            Administra tu agenda de contactos y locales técnicos para vincularlos a tus ventas.
          </p>
        </div>
        <Link href="/clientes/nuevo">
          <Button className="w-full sm:w-auto bg-copper hover:bg-copper-hover text-black font-semibold">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader title="Agenda de Clientes" />
        {clientes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Todavía no registraste ningún cliente local o técnico.</p>
            <Link href="/clientes/nuevo">
              <Button variant="secondary" className="mt-4">
                Registrar primer cliente
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 px-5 pb-5 pt-2">
            {clientes.map((cliente) => (
              <Link href={`/clientes/${cliente.id}`} key={cliente.id}>
              <div 
                className="bg-slate-900/50 p-5 rounded-lg border border-slate-800 hover:border-copper/50 transition-colors relative overflow-hidden h-full flex flex-col"
              >
                <div className="absolute top-0 right-0 bg-copper/10 text-copper px-3 py-1 rounded-bl-lg text-xs font-bold">
                  #{cliente.numero_cliente}
                </div>
                <h3 className="font-semibold text-lg text-white mb-3 pr-12 flex items-start justify-between">
                  {cliente.nombre_local}
                </h3>
                
                <div className="space-y-2 text-sm text-slate-400">
                  {cliente.telefono ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span>{cliente.telefono}</span>
                    </div>
                  ) : null}
                  
                  {cliente.email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                  ) : null}
                  
                  {cliente.direccion ? (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cliente.direccion}</span>
                    </div>
                  ) : null}
                </div>

                {cliente.notas && (
                  <div className="mt-4 pt-4 border-t border-slate-800/50 text-xs text-slate-500 italic line-clamp-2">
                    {cliente.notas}
                  </div>
                )}
                <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                   <div className="flex items-center gap-1.5 text-slate-400">
                     <Wallet className="w-4 h-4" />
                     Saldo a favor:
                   </div>
                   <div className={`font-mono font-bold ${cliente.saldo_actual > 0 ? 'text-green-400' : 'text-slate-300'}`}>
                     ${Number(cliente.saldo_actual).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                   </div>
                </div>
              </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
