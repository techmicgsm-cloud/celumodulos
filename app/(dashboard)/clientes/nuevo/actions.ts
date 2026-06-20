"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearCliente(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado" };
  }

  const nombre_local = formData.get("nombre_local") as string;
  const telefono = formData.get("telefono") as string;
  const email = formData.get("email") as string;
  const direccion = formData.get("direccion") as string;
  const notas = formData.get("notas") as string;

  if (!nombre_local || nombre_local.trim().length === 0) {
    return { error: "El nombre del cliente o local es obligatorio." };
  }

  try {
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        user_id: user.id,
        nombre_local: nombre_local.trim(),
        telefono: telefono ? telefono.trim() : null,
        email: email ? email.trim() : null,
        direccion: direccion ? direccion.trim() : null,
        notas: notas ? notas.trim() : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error insertando cliente:", error);
      return { error: error.message || "Error al crear el cliente." };
    }

    revalidatePath("/clientes");
    revalidatePath("/ventas/nueva");
    
    return { success: true, clienteId: data.id };
  } catch (error: any) {
    console.error("Error inesperado creando cliente:", error);
    return { error: "Ocurrió un error inesperado." };
  }
}
