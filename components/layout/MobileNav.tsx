"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, PackagePlus, Cpu } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/importaciones", label: "Importaciones", icon: History },
  { href: "/importaciones/nueva", label: "Nueva", icon: PackagePlus },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="md:hidden sticky top-0 z-20 bg-bg-panel border-b border-white/5">
      <div className="flex items-center gap-2 h-14 px-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-bg-recessed border border-white/10 text-copper">
          <Cpu size={15} strokeWidth={1.75} />
        </div>
        <p className="text-sm font-semibold text-text-primary">Voltrix</p>
      </div>
      <nav className="flex px-2 pb-2 gap-1">
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
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs flex-1 justify-center",
                activo
                  ? "bg-bg-panel-2 text-copper"
                  : "text-text-secondary"
              )}
            >
              <Icon size={14} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
