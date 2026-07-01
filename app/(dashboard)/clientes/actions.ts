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

export async function registrarPagoCliente(clienteId: string, formData: FormData, clienteNombre: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autenticado" };
  }

  const monto = Number(formData.get("monto"));
  const metodo_pago = formData.get("metodo_pago") as string;
  const notas = formData.get("notas") as string;

  if (!monto || monto <= 0) {
    return { error: "El monto debe ser mayor a 0." };
  }
  if (!metodo_pago) {
    return { error: "Debes seleccionar un método de pago." };
  }

  try {
    // 1. Obtener cliente actual para sumar el saldo
    const { data: cliente, error: getError } = await supabase
      .from("clientes")
      .select("saldo_actual")
      .eq("id", clienteId)
      .eq("user_id", user.id)
      .single();

    if (getError || !cliente) {
      return { error: "No se pudo obtener la información del cliente." };
    }

    const nuevoSaldo = Number(cliente.saldo_actual) + monto;

    // 2. Actualizar saldo del cliente
    const { error: updateError } = await supabase
      .from("clientes")
      .update({ saldo_actual: nuevoSaldo })
      .eq("id", clienteId)
      .eq("user_id", user.id);

    if (updateError) {
      return { error: "Error al actualizar el saldo del cliente." };
    }

    // 3. Registrar movimiento en la cuenta corriente del cliente
    let conceptoCC = "Pago a cuenta";
    if (notas) conceptoCC += ` - ${notas}`;

    await supabase.from("movimientos_cc").insert({
      user_id: user.id,
      cliente_id: clienteId,
      monto: monto, // Positivo porque es un pago a favor
      concepto: conceptoCC,
    });

    // 4. Registrar ingreso en la caja (movimientos_caja)
    await supabase.from("movimientos_caja").insert({
      user_id: user.id,
      tipo: "ingreso",
      monto: monto,
      metodo_pago: metodo_pago,
      concepto: `Pago de deuda CC - Cliente: ${clienteNombre}`,
    });

    revalidatePath(`/clientes/${clienteId}`);
    revalidatePath("/clientes");
    revalidatePath("/caja");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error al registrar pago:", error);
    return { error: "Ocurrió un error inesperado al registrar el pago." };
  }
}

