import { MARGENES, type Margen } from "./types";

/**
 * Factor = gasto total en pesos / valor total de mercadería en USD.
 * Representa cuántos pesos "reales" cuesta cada dólar de mercadería
 * una vez prorrateados flete, despacho, impuestos, etc.
 */
export function calcularFactor(
  gastoTotalPesos: number,
  totalUsdMercaderia: number
): number {
  if (!totalUsdMercaderia || totalUsdMercaderia <= 0) return 0;
  return gastoTotalPesos / totalUsdMercaderia;
}

/** Costo real unitario (ARS) = precio USD unitario × factor. */
export function calcularCostoRealUnitario(
  precioUsdUnitario: number,
  factor: number
): number {
  return precioUsdUnitario * factor;
}

/** Valor total por modelo (ARS) = costo real unitario × cantidad. */
export function calcularValorTotalModelo(
  costoRealUnitario: number,
  cantidad: number
): number {
  return costoRealUnitario * cantidad;
}

/** Precio de venta sugerido = costo real unitario × (1 + margen/100). */
export function calcularPrecioSugerido(
  costoRealUnitario: number,
  margen: Margen
): number {
  return costoRealUnitario * (1 + margen / 100);
}

/** Devuelve los 5 precios sugeridos (20/30/40/50/100%) para un costo real unitario. */
export function calcularPreciosSugeridos(
  costoRealUnitario: number
): Record<Margen, number> {
  const resultado = {} as Record<Margen, number>;
  for (const margen of MARGENES) {
    resultado[margen] = calcularPrecioSugerido(costoRealUnitario, margen);
  }
  return resultado;
}

/** Ganancia potencial para un costo real total dado un margen. */
export function calcularGananciaPotencial(
  valorTotalReal: number,
  margen: Margen
): number {
  return valorTotalReal * (margen / 100);
}

export function formatARS(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

export function formatUSD(valor: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(valor || 0);
}

export function formatNumero(valor: number, decimales = 0): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor || 0);
}

export function formatFecha(fechaISO: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fechaISO));
}
