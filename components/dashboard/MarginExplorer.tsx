"use client";

import { useState } from "react";
import clsx from "clsx";
import { MARGENES, type Margen } from "@/lib/types";
import { calcularGananciaPotencial, formatARS } from "@/lib/calculations";
import { CardHeader } from "@/components/ui/Card";

export function MarginExplorer({ capitalInvertido }: { capitalInvertido: number }) {
  const [margen, setMargen] = useState<Margen>(30);

  const ganancia = calcularGananciaPotencial(capitalInvertido, margen);
  const ventaTotal = capitalInvertido + ganancia;

  return (
    <div className="rounded-lg border border-white/8 bg-bg-panel p-5">
      <CardHeader
        title="Ganancia potencial"
        description="Proyectada sobre el stock actual según el margen elegido"
      />

      <div className="flex flex-wrap gap-1.5 mb-5">
        {MARGENES.map((m) => (
          <button
            key={m}
            onClick={() => setMargen(m)}
            className={clsx(
              "px-3 py-1.5 rounded-md text-xs font-medium tabular-nums transition-colors border",
              margen === m
                ? "bg-copper/15 border-copper/40 text-copper-bright"
                : "border-white/10 text-text-secondary hover:bg-white/5"
            )}
          >
            +{m}%
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] text-text-muted mb-1">Venta total sugerida</p>
          <p className="text-xl font-semibold text-text-primary tabular-nums">
            {formatARS(ventaTotal)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted mb-1">Ganancia potencial</p>
          <p className="text-xl font-semibold text-signal-green tabular-nums">
            {formatARS(ganancia)}
          </p>
        </div>
      </div>
    </div>
  );
}
