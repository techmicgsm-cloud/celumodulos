"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function actualizarCliente(clienteId: string, formData: FormData) {
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
    const { error } = await supabase
      .from("clientes")
      .update({
        nombre_local: nombre_local.trim(),
        telefono: telefono ? telefono.trim() : null,
        email: email ? email.trim() : null,
        direccion: direccion ? direccion.trim() : null,
        notas: notas ? notas.trim() : null,
      })
      .eq("id", clienteId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error actualizando cliente:", error);
      return { error: error.message || "Error al actualizar el cliente." };
    }

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${clienteId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error inesperado actualizando cliente:", error);
    return { error: "Ocurrió un error inesperado." };
  }
}

export async function eliminarCliente(clienteId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado" };
  }

  try {
    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", clienteId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error eliminando cliente:", error);
      return { error: error.message || "Error al eliminar el cliente." };
    }

    revalidatePath("/clientes");
  } catch (error: any) {
    console.error("Error inesperado eliminando cliente:", error);
    return { error: "Ocurrió un error inesperado al eliminar." };
  }

  redirect("/clientes");
}
