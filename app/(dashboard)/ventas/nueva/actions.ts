"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface VentaItemInput {
  modelo: string;
  sku: string | null;
  cantidad: number;
  precio_venta_unitario: number;
}

export async function crearVenta(clienteId: string | null, notas: string, items: VentaItemInput[], saldoADescontar: number = 0) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado" };
  }

  // Filtrar items válidos
  const validItems = items.filter(
    (i) => i.modelo && i.cantidad > 0 && i.precio_venta_unitario >= 0
  );

  if (validItems.length === 0) {
    return { error: "Debe agregar al menos un ítem válido." };
  }

  try {
    // Llamar a la función RPC de Supabase
    const { data, error } = await supabase.rpc("registrar_venta_fifo", {
      p_user_id: user.id,
      p_cliente_id: clienteId || null,
      p_cliente_nombre: null, // Deprecado
      p_notas: notas || null,
      p_items: validItems,
      p_saldo_a_descontar: saldoADescontar
    });

    if (error) {
      console.error("Error RPC registrar_venta_fifo:", error);
      return { error: error.message || "Error al procesar la venta." };
    }

    revalidatePath("/ventas");
    revalidatePath("/importaciones"); // Por el stock disponible
    revalidatePath("/");
    
    return { success: true, ventaId: data.venta_id };
  } catch (error: any) {
    console.error("Error inesperado creando venta:", error);
    return { error: "Ocurrió un error inesperado." };
  }
}
