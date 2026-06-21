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
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 border-y border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Nº Cliente</th>
                  <th className="px-6 py-3 font-semibold">Nombre o Local</th>
                  <th className="px-6 py-3 font-semibold">Contacto</th>
                  <th className="px-6 py-3 font-semibold text-right">Saldo a favor</th>
                  <th className="px-6 py-3 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      #{String(cliente.numero_cliente).padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {cliente.nombre_local}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div className="flex flex-col gap-1">
                        {cliente.telefono && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {cliente.telefono}
                          </div>
                        )}
                        {cliente.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            {cliente.email}
                          </div>
                        )}
                        {!cliente.telefono && !cliente.email && (
                          <span className="text-slate-600 italic">Sin contacto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-mono font-medium ${cliente.saldo_actual > 0 ? 'text-green-400' : 'text-slate-300'}`}>
                        ${Number(cliente.saldo_actual).toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/clientes/${cliente.id}`}>
                        <Button variant="secondary" size="sm" className="bg-slate-800 hover:bg-slate-700 text-xs py-1 h-7">
                          Ver Perfil
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
