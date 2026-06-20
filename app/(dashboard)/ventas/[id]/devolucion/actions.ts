"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function procesarDevolucion(formData: FormData) {
  const ventaId = formData.get("venta_id") as string;
  const ventaItemId = formData.get("venta_item_id") as string;
  const cantidad = parseInt(formData.get("cantidad") as string, 10);
  const estado = formData.get("estado") as string; // 'bueno' o 'fallado'

  if (!ventaId || !ventaItemId || isNaN(cantidad) || cantidad <= 0 || !estado) {
    return { error: "Faltan datos obligatorios para la devolución." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuario no autenticado." };
  }

  const { data, error } = await supabase.rpc("registrar_devolucion", {
    p_user_id: user.id,
    p_venta_item_id: ventaItemId,
    p_cantidad: cantidad,
    p_estado: estado,
  });

  if (error) {
    console.error("Error al registrar devolución:", error);
    return { error: error.message || "Error al procesar la devolución." };
  }

  revalidatePath("/ventas");
  revalidatePath(`/ventas/${ventaId}`);
  revalidatePath("/clientes");
  revalidatePath("/devoluciones");
  
  return { success: true, devolucionId: data.devolucion_id };
}
