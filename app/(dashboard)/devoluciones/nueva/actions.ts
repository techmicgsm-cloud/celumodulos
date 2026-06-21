"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function buscarVentasPorFiltro(filtro: string) {
  const supabase = await createClient();
  

  let query = supabase
    .from("ventas")
    .select(`
      *,
      cliente:clientes(nombre_local),
      items:venta_items(
        *,
        lotes:venta_item_lotes(
          importacion_item:importacion_items(marca, categoria)
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  const isNumeric = !isNaN(Number(filtro)) && !filtro.includes('-');
  const isPosibleUUID = filtro.length >= 4 && /^[0-9a-fA-F-]+$/.test(filtro);

  // Helper para buscar prefijos de UUID
  const formatUuid = (hex: string) => `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
  const getUuidRange = (prefix: string) => {
    const clean = prefix.toLowerCase().replace(/-/g, '');
    if (clean.length > 32) return null;
    return {
      min: formatUuid(clean.padEnd(32, '0')),
      max: formatUuid(clean.padEnd(32, 'f'))
    };
  };

  if (isNumeric) {
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("id")
      .eq("numero_cliente", Number(filtro))
      .single();
      
    if (clienteData) {
      query = query.eq("cliente_id", clienteData.id);
    } else {
      // Si no es un cliente, intentar como UUID (ticket numérico corto)
      const range = getUuidRange(filtro);
      if (range) {
        query = query.gte("id", range.min).lte("id", range.max);
      } else {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    }
  } else if (isPosibleUUID) {
    const range = getUuidRange(filtro);
    if (range) {
      query = query.gte("id", range.min).lte("id", range.max);
    } else {
      query = query.ilike("cliente_nombre", `%${filtro}%`);
    }
  } else {
    // Buscar por nombre de cliente
    query = query.ilike("cliente_nombre", `%${filtro}%`);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error("Error buscando ventas:", error);
    return [];
  }
  return data;
}

export async function procesarDevolucion(
  ventaItemId: string,
  cantidad: number,
  estado: "bueno" | "fallado",
  montoAcreditar: number,
  ventaId: string,
  clienteId?: string
) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { error: "No autorizado." };
  }
  const userId = userData.user.id;

  try {
    // 1. Verificar el item de venta
    const { data: itemData, error: itemError } = await supabase
      .from("venta_items")
      .select("*")
      .eq("id", ventaItemId)
      .single();
      
    if (itemError || !itemData) return { error: "Item de venta no encontrado." };
    if (cantidad > itemData.cantidad) return { error: "La cantidad a devolver no puede ser mayor a la vendida." };

    // 2. Insertar la devolución
    const { data: devData, error: devError } = await supabase
      .from("devoluciones")
      .insert({
        user_id: userId,
        venta_item_id: ventaItemId,
        cantidad,
        estado,
        monto_acreditado: montoAcreditar
      })
      .select("id")
      .single();

    if (devError) throw devError;

    // 3. Acreditar saldo en cuenta corriente si hay cliente
    if (clienteId && montoAcreditar > 0) {
      // Registrar movimiento CC
      const { error: movError } = await supabase
        .from("movimientos_cc")
        .insert({
          user_id: userId,
          cliente_id: clienteId,
          monto: montoAcreditar,
          concepto: `RMA: Devolución de ${itemData.modelo} (Cant: ${cantidad}) - Estado: ${estado}`,
          referencia_id: devData.id
        });
      if (movError) throw movError;

      // Actualizar saldo_actual del cliente
      const { data: clienteActual, error: cliError } = await supabase
        .from("clientes")
        .select("saldo_actual")
        .eq("id", clienteId)
        .single();
        
      if (!cliError && clienteActual) {
        await supabase
          .from("clientes")
          .update({ saldo_actual: Number(clienteActual.saldo_actual) + Number(montoAcreditar) })
          .eq("id", clienteId);
      }
    }

    // 4. Devolver al inventario si el estado es 'bueno'
    if (estado === "bueno") {
      // Buscar los lotes de donde salió esta venta
      const { data: lotes, error: lotesError } = await supabase
        .from("venta_item_lotes")
        .select("importacion_item_id, cantidad_tomada")
        .eq("venta_item_id", ventaItemId);

      if (!lotesError && lotes && lotes.length > 0) {
        // Devolvemos al primer lote (simplificación: devolvemos toda la cantidad al primer lote de donde se tomó)
        // O lo distribuimos. Para simplificar, lo devolvemos al primer lote que encontremos.
        const primerLote = lotes[0];
        
        const { data: impItem, error: impError } = await supabase
          .from("importacion_items")
          .select("cantidad_disponible")
          .eq("id", primerLote.importacion_item_id)
          .single();
          
        if (!impError && impItem) {
          await supabase
            .from("importacion_items")
            .update({ cantidad_disponible: impItem.cantidad_disponible + cantidad })
            .eq("id", primerLote.importacion_item_id);
        }
      }
    }

    revalidatePath("/devoluciones");
    revalidatePath("/ventas");
    revalidatePath("/clientes");
    revalidatePath("/importaciones");
    
    return { success: true };
  } catch (err: any) {
    console.error("Error al procesar devolución:", err);
    return { error: "Ocurrió un error inesperado al procesar la devolución." };
  }
}
