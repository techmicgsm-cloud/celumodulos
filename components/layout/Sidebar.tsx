"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, PackagePlus, Cpu, ShoppingCart, Users, LogOut, RefreshCcw, LayoutGrid } from "lucide-react";
import clsx from "clsx";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/importaciones", label: "Importaciones", icon: History },
  { href: "/importaciones/nueva", label: "Nueva importación", icon: PackagePlus },
  { href: "/devoluciones", label: "Devoluciones", icon: RefreshCcw },
  { href: "/catalogo", label: "Catálogo", icon: LayoutGrid },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-white/5 bg-bg-panel">
      <div className="flex items-center gap-2.5 h-16 px-5 border-b border-white/5">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-bg-recessed border border-white/10 text-copper">
          <Cpu size={17} strokeWidth={1.75} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-text-primary tracking-tight">
            Voltrix
          </p>
          <p className="instrument-label text-[10px]">ERP de módulos</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const activo =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors border-l-2",
                activo
                  ? "bg-bg-panel-2 border-copper text-text-primary"
                  : "border-transparent text-text-secondary hover:bg-bg-panel-2 hover:text-text-primary"
              )}
            >
              <Icon size={17} strokeWidth={1.75} className={activo ? "text-copper" : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/5 space-y-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </form>
        <p className="text-[11px] text-text-muted leading-relaxed">
          Costos y precios calculados en base al factor real de cada
          importación.
        </p>
      </div>
    </aside>
  );
}
