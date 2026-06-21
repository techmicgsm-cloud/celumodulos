"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Registra un ingreso o egreso manual
export async function registrarMovimientoCaja(formData: FormData) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { error: "No autorizado" };
  }

  const tipo = formData.get("tipo") as string;
  const monto = Number(formData.get("monto"));
  const metodo_pago = formData.get("metodo_pago") as string;
  const concepto = formData.get("concepto") as string;

  if (!tipo || !monto || !metodo_pago || !concepto) {
    return { error: "Todos los campos son obligatorios" };
  }

  if (monto <= 0) {
    return { error: "El monto debe ser mayor a 0" };
  }

  const { error } = await supabase.from("movimientos_caja").insert({
    user_id: userData.user.id,
    tipo,
    monto,
    metodo_pago,
    concepto,
  });

  if (error) {
    console.error("Error al registrar movimiento:", error);
    return { error: "Error al guardar el movimiento de caja." };
  }

  revalidatePath("/caja");
  return { success: true };
}

// Obtener el resumen del día actual
export async function obtenerResumenCajaDia() {
  const supabase = await createClient();
  
  // Rango del día de hoy (local o UTC, para simplificar usamos UTC del día actual)
  // Lo ideal es que el servidor use startOfDay y endOfDay
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const startIso = startOfDay.toISOString();
  const endIso = endOfDay.toISOString();

  // 1. Ventas de hoy
  const { data: ventas } = await supabase
    .from("ventas")
    .select("id, total_venta, metodo_pago, created_at, cliente:clientes(nombre_local), cliente_nombre")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false });

  // 2. Devoluciones de hoy (que implican salida de dinero en efectivo para consumidor final)
  // Si fue a cuenta corriente no afecta la caja física.
  const { data: devoluciones } = await supabase
    .from("devoluciones")
    .select("id, monto_acreditado, created_at, venta_item:venta_items(venta:ventas(cliente_id))")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false });

  // 3. Movimientos Manuales
  const { data: movimientos } = await supabase
    .from("movimientos_caja")
    .select("*")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false });

  return {
    ventas: ventas || [],
    devoluciones: devoluciones || [],
    movimientos: movimientos || [],
  };
}
