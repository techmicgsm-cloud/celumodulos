"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  calcularCostoRealUnitario,
  calcularFactor,
  calcularValorTotalModelo,
} from "@/lib/calculations";

interface ItemRecibido {
  marca: string;
  categoria: string;
  modelo: string;
  sku: string;
  cantidad: number;
  precioUsdUnitario: number;
}

export interface ResultadoCrearImportacion {
  id?: string;
  error?: string;
}

const BUCKET_FACTURAS = "facturas";

export async function crearImportacion(
  formData: FormData
): Promise<ResultadoCrearImportacion> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para crear una importación." };
  }

  const nombre = (formData.get("nombre") as string)?.trim();
  const notas = (formData.get("notas") as string)?.trim();
  const totalUsd = Number(formData.get("totalUsd"));
  const gastoPesos = Number(formData.get("gastoPesos"));
  const itemsRaw = formData.get("items") as string | null;
  const factura = formData.get("factura") as File | null;

  if (!totalUsd || totalUsd <= 0) {
    return { error: "El total de mercadería en USD debe ser mayor a 0." };
  }
  if (!gastoPesos || gastoPesos <= 0) {
    return { error: "El gasto total en pesos debe ser mayor a 0." };
  }

  let items: ItemRecibido[] = [];
  try {
    items = JSON.parse(itemsRaw ?? "[]");
  } catch {
    return { error: "Los modelos enviados tienen un formato inválido." };
  }

  if (items.length === 0) {
    return { error: "Agregá al menos un modelo antes de guardar." };
  }
  for (const item of items) {
    if (!item.modelo?.trim()) {
      return { error: "Todos los modelos necesitan un nombre." };
    }
    if (!item.cantidad || item.cantidad <= 0) {
      return { error: `La cantidad de "${item.modelo}" debe ser mayor a 0.` };
    }
    if (!item.precioUsdUnitario || item.precioUsdUnitario <= 0) {
      return { error: `El precio USD de "${item.modelo}" debe ser mayor a 0.` };
    }
  }

  const factor = calcularFactor(gastoPesos, totalUsd);

  let facturaUrl: string | null = null;
  let facturaNombreArchivo: string | null = null;
  let facturaPath: string | null = null;

  if (factura && factura.size > 0) {
    const extension = factura.name.split(".").pop() || "bin";
    const path = `${user.id}/${Date.now()}-${randomUUID()}.${extension}`;
    const arrayBuffer = await factura.arrayBuffer();

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET_FACTURAS)
      .upload(path, arrayBuffer, {
        contentType: factura.type || "application/octet-stream",
      });

    if (errorSubida) {
      return { error: `No se pudo subir la factura: ${errorSubida.message}` };
    }

    facturaPath = path;
    facturaNombreArchivo = factura.name;
  }

  const { data: importacion, error: errorInsert } = await supabase
    .from("importaciones")
    .insert({
      user_id: user.id,
      nombre: nombre || null,
      notas: notas || null,
      factura_path: facturaPath,
      factura_nombre_archivo: facturaNombreArchivo,
      total_usd_mercaderia: totalUsd,
      gasto_total_pesos: gastoPesos,
      factor,
    })
    .select("id")
    .single();

  if (errorInsert || !importacion) {
    return { error: errorInsert?.message ?? "No se pudo crear la importación." };
  }

  const modelosAInsertar = items.map((item) => {
    const costoRealUnitario = calcularCostoRealUnitario(item.precioUsdUnitario, factor);
    const valorTotal = calcularValorTotalModelo(costoRealUnitario, item.cantidad);
    return {
      importacion_id: importacion.id,
      user_id: user.id,
      marca: item.marca?.trim() || null,
      categoria: item.categoria?.trim() || null,
      modelo: item.modelo.trim(),
      sku: item.sku?.trim() || null,
      cantidad_inicial: item.cantidad,
      cantidad_disponible: item.cantidad,
      precio_usd_unitario: item.precioUsdUnitario,
      costo_real_unitario: costoRealUnitario,
      valor_total: valorTotal,
    };
  });

  const { error: errorItems } = await supabase.from("importacion_items").insert(modelosAInsertar);
  if (errorItems) {
    return { error: `La importación se creó pero los modelos fallaron: ${errorItems.message}` };
  }

  revalidatePath("/");
  revalidatePath("/importaciones");

  return { id: importacion.id as string };
}
