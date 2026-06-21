"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { InstrumentPanel } from "@/components/ui/InstrumentPanel";
import { FacturaUpload } from "@/components/forms/FacturaUpload";
import { ModeloRow } from "@/components/forms/ModeloRow";
import { MARGENES, type ModeloFormInput } from "@/lib/types";
import {
  calcularCostoRealUnitario,
  calcularFactor,
  calcularValorTotalModelo,
  formatARS,
  formatUSD,
} from "@/lib/calculations";
import { crearImportacion, actualizarImportacion } from "@/app/(dashboard)/importaciones/nueva/actions";
import { extraerDatosFactura } from "@/app/importaciones/nueva/ai-actions";

function nuevoItem(): ModeloFormInput {
  return {
    clienteId: crypto.randomUUID(),
    marca: "",
    categoria: "",
    modelo: "",
    sku: "",
    cantidad: 1,
    precioUsdUnitario: 0,
  };
}

export function ImportacionForm({
  importacionId,
  initialData
}: {
  importacionId?: string;
  initialData?: any;
}) {
  const router = useRouter();

  const [nombre, setNombre] = useState(initialData?.nombre || "");
  const [totalUsd, setTotalUsd] = useState<number>(initialData?.total_usd_mercaderia || 0);
  const [gastoPesos, setGastoPesos] = useState<number>(initialData?.gasto_total_pesos || 0);
  const [factura, setFactura] = useState<File | null>(null);
  const [items, setItems] = useState<ModeloFormInput[]>(() => {
    if (initialData?.items && initialData.items.length > 0) {
      return initialData.items.map((i: any) => ({
        id: i.id,
        clienteId: crypto.randomUUID(),
        marca: i.marca || "",
        categoria: i.categoria || "",
        modelo: i.modelo || "",
        sku: i.sku || "",
        cantidad: i.cantidad_inicial || 1,
        precioUsdUnitario: i.precio_usd_unitario || 0,
      }));
    }
    return [nuevoItem()];
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [procesandoIA, setProcesandoIA] = useState(false);

  const factor = calcularFactor(gastoPesos, totalUsd);

  const totalUsdIngresado = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad * item.precioUsdUnitario, 0),
    [items]
  );
  const capitalTotalArs = useMemo(
    () =>
      items.reduce((acc, item) => {
        const costoReal = calcularCostoRealUnitario(item.precioUsdUnitario, factor);
        return acc + calcularValorTotalModelo(costoReal, item.cantidad);
      }, 0),
    [items, factor]
  );

  const diferenciaUsd = totalUsd - totalUsdIngresado;
  const hayDiferenciaSignificativa = totalUsd > 0 && Math.abs(diferenciaUsd) > 0.5;

  function actualizarItem(clienteId: string, patch: Partial<ModeloFormInput>) {
    setItems((prev) =>
      prev.map((item) => (item.clienteId === clienteId ? { ...item, ...patch } : item))
    );
  }

  function agregarItem() {
    setItems((prev) => [...prev, nuevoItem()]);
  }

  function quitarItem(clienteId: string) {
    setItems((prev) => prev.filter((item) => item.clienteId !== clienteId));
  }

  async function handleProcesarFactura() {
    if (!factura) return;
    
    setProcesandoIA(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", factura);
      const res = await extraerDatosFactura(formData);
      
      if (res.error) {
        setError("Error de IA: " + res.error);
        return;
      }
      
      if (res.data && res.data.length > 0) {
        const nuevosItems = res.data.map((item: any) => ({
          clienteId: crypto.randomUUID(),
          marca: item.marca || "",
          categoria: item.categoria || "",
          sku: item.sku || "",
          modelo: item.modelo || "Desconocido",
          cantidad: item.cantidad || 1,
          precioUsdUnitario: item.precioUsdUnitario || 0,
        }));
        
        if (items.length === 1 && !items[0].modelo && items[0].cantidad === 1 && items[0].precioUsdUnitario === 0) {
          setItems(nuevosItems);
        } else {
          setItems(prev => [...prev, ...nuevosItems]);
        }
      } else {
        setError("La IA no encontró productos reconocibles en la factura.");
      }
    } catch (err: any) {
      setError("Error inesperado al contactar a la IA.");
    } finally {
      setProcesandoIA(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (totalUsd <= 0) {
      setError("Ingresá el valor total de mercadería en USD.");
      return;
    }
    if (gastoPesos <= 0) {
      setError("Ingresá el gasto total en pesos argentinos.");
      return;
    }
    if (items.some((i) => !i.modelo.trim() || i.cantidad <= 0 || i.precioUsdUnitario <= 0)) {
      setError("Completá modelo, cantidad y precio USD en todas las filas.");
      return;
    }

    setEnviando(true);
    const formData = new FormData();
    formData.set("nombre", nombre);
    formData.set("totalUsd", String(totalUsd));
    formData.set("gastoPesos", String(gastoPesos));
    formData.set(
      "items",
      JSON.stringify(
        items.map((i) => ({
          id: i.id,
          marca: i.marca,
          categoria: i.categoria,
          modelo: i.modelo,
          sku: i.sku,
          cantidad: i.cantidad,
          precioUsdUnitario: i.precioUsdUnitario,
        }))
      )
    );
    if (factura) formData.set("factura", factura);

    const resultado = importacionId 
      ? await actualizarImportacion(importacionId, formData)
      : await crearImportacion(formData);
      
    setEnviando(false);

    if (resultado.error) {
      setError(resultado.error);
      return;
    }
    router.push(`/importaciones/${resultado.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader
          title="1. Factura y totales"
          description="Cargá la factura de compra y los totales generales de la importación"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
          <div className="space-y-4">
            <Field label="Nombre de la importación (opcional)">
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Importación enero 2026"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Total mercadería (USD)"
                hint="Valor declarado en la factura, en dólares"
              >
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={totalUsd || ""}
                  onChange={(e) => setTotalUsd(Number(e.target.value))}
                  placeholder="0.00"
                />
              </Field>
              <Field
                label="Gasto total (ARS)"
                hint="Flete, despacho, impuestos, todo incluido"
              >
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={gastoPesos || ""}
                  onChange={(e) => setGastoPesos(Number(e.target.value))}
                  placeholder="0"
                />
              </Field>
            </div>

            <Field label="Factura de compra (opcional)">
              <div className="space-y-3">
                <FacturaUpload file={factura} onChange={setFactura} />
                
                {factura && (
                  <button
                    type="button"
                    onClick={handleProcesarFactura}
                    disabled={procesandoIA}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-copper/10 border border-copper/30 px-3 py-2 text-sm font-medium text-copper hover:bg-copper/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {procesandoIA ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {procesandoIA ? "Extrayendo datos..." : "Auto-completar modelos con IA"}
                  </button>
                )}
              </div>
            </Field>
          </div>

          <InstrumentPanel
            label="Factor calculado"
            value={factor > 0 ? factor.toFixed(2) : "—"}
            unit="$ ARS / U$D"
            sublabel="Gasto total en ARS ÷ mercadería en USD"
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="2. Modelos importados"
          description="Cargá cada modelo con su cantidad y precio unitario en USD"
        />

        <div className="overflow-x-auto scroll-thin -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left">
                <th className="instrument-label text-[10px] font-normal py-2 px-3">Marca</th>
                <th className="instrument-label text-[10px] font-normal py-2 px-3">Categoría</th>
                <th className="instrument-label text-[10px] font-normal py-2 px-3">SKU</th>
                <th className="instrument-label text-[10px] font-normal py-2 px-3">Modelo</th>
                <th className="instrument-label text-[10px] font-normal py-2 px-2">Cant.</th>
                <th className="instrument-label text-[10px] font-normal py-2 px-2">USD unit.</th>
                <th className="instrument-label text-[10px] font-normal py-2 px-3 text-right">
                  Costo real
                </th>
                <th className="instrument-label text-[10px] font-normal py-2 px-3 text-right">
                  Valor total
                </th>
                {MARGENES.map((margen) => (
                  <th
                    key={margen}
                    className="instrument-label text-[10px] font-normal py-2 px-3 text-right whitespace-nowrap"
                  >
                    PV {margen}%
                  </th>
                ))}
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <ModeloRow
                  key={item.clienteId}
                  item={item}
                  factor={factor}
                  onChange={actualizarItem}
                  onRemove={quitarItem}
                  removable={items.length > 1}
                />
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={agregarItem}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-copper hover:text-copper-bright"
        >
          <Plus size={15} strokeWidth={2} />
          Agregar modelo
        </button>

        <div className="mt-6 pt-5 border-t border-white/8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-text-muted mb-1">
              USD ingresado en modelos vs. declarado
            </p>
            <p className="text-sm tabular-nums text-text-secondary">
              {formatUSD(totalUsdIngresado)}{" "}
              <span className="text-text-muted">/ {formatUSD(totalUsd)}</span>
            </p>
            {hayDiferenciaSignificativa && (
              <p className="flex items-center gap-1.5 text-xs text-signal-amber mt-1.5">
                <AlertTriangle size={13} strokeWidth={1.75} />
                Diferencia de {formatUSD(Math.abs(diferenciaUsd))} respecto al total declarado
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] text-text-muted mb-1">Capital total (ARS)</p>
            <p className="text-xl font-semibold text-copper tabular-nums">
              {formatARS(capitalTotalArs)}
            </p>
          </div>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-signal-red/30 bg-signal-red/10 px-4 py-3 text-sm text-signal-red">
          <AlertTriangle size={15} strokeWidth={1.75} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push("/importaciones")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar importación"}
        </Button>
      </div>
    </form>
  );
}
