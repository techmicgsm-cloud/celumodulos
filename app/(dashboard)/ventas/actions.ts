"use server";

import { obtenerVentaPorId } from "@/lib/data";

export async function getVentaParaTicket(id: string) {
  const venta = await obtenerVentaPorId(id);
  return venta;
}
