import { createClient } from "@/lib/supabase/server";
import type { Importacion, ImportacionConModelos, ModeloItem, Venta, StockAgrupado, Cliente, MovimientoCC, Devolucion, CatalogoItem } from "@/lib/types";

/** Trae todas las importaciones, más recientes primero. */
export async function obtenerImportaciones(): Promise<Importacion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("importaciones")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error al obtener importaciones: ${error.message}`);
  }

  return data ?? [];
}

/** Trae todos los modelos (items) de todas las importaciones. */
export async function obtenerTodosLosModelos(): Promise<ModeloItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("importacion_items").select("*");

  if (error) {
    throw new Error(`Error al obtener modelos: ${error.message}`);
  }

  // Renombramos fields para compatibilidad con el frontend temporalmente
  // aunque lo ideal es actualizar el frontend para que use cantidad_disponible
  return (data ?? []).map(item => ({
    ...item,
    cantidad: item.cantidad_disponible
  })) as ModeloItem[];
}

/** Trae una importación puntual junto con sus modelos. */
export async function obtenerImportacionPorId(
  id: string
): Promise<ImportacionConModelos | null> {
  const supabase = await createClient();

  const { data: importacion, error: errorImportacion } = await supabase
    .from("importaciones")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (errorImportacion) {
    throw new Error(`Error al obtener la importación: ${errorImportacion.message}`);
  }
  if (!importacion) return null;

  // Generar Signed URL si existe un path
  if (importacion.factura_path) {
    const { data: signedData } = await supabase.storage
      .from("facturas")
      .createSignedUrl(importacion.factura_path, 3600); // 1 hora
    importacion.factura_url = signedData?.signedUrl ?? null;
  }

  const { data: modelos, error: errorModelos } = await supabase
    .from("importacion_items")
    .select("*")
    .eq("importacion_id", id)
    .order("created_at", { ascending: true });

  if (errorModelos) {
    throw new Error(`Error al obtener los modelos: ${errorModelos.message}`);
  }

  return { ...importacion, modelos: (modelos ?? []).map(item => ({...item, cantidad: item.cantidad_disponible})) } as any;
}

export async function obtenerStockAgrupado(): Promise<StockAgrupado[]> {
  const supabase = await createClient();
  const config = await obtenerConfiguracionAdmin();
  const margen = config?.margen_publico_defecto || 40;

  const { data, error } = await supabase
    .from("importacion_items")
    .select("modelo, sku, marca, categoria, cantidad_disponible, precio_usd_unitario")
    .gt("cantidad_disponible", 0);

  if (error) {
    console.error("Error fetching stock:", error);
    return [];
  }

  const agrupado: Record<string, StockAgrupado & { total_usd: number }> = {};
  for (const item of data) {
    const key = `${item.modelo}-${item.sku || ""}`;
    if (!agrupado[key]) {
      agrupado[key] = {
        modelo: item.modelo,
        sku: item.sku,
        marca: item.marca,
        categoria: item.categoria,
        cantidad_disponible: 0,
        total_usd: 0,
      };
    }
    agrupado[key].cantidad_disponible += item.cantidad_disponible;
    agrupado[key].total_usd += item.precio_usd_unitario * item.cantidad_disponible;
  }

  return Object.values(agrupado).map(item => {
    const costoUsdPromedio = item.cantidad_disponible > 0 ? item.total_usd / item.cantidad_disponible : 0;
    const precioSugerido = costoUsdPromedio * (1 + (margen / 100));
    
    // Cleanup total_usd property
    const { total_usd, ...rest } = item;
    return {
      ...rest,
      precio_sugerido: parseFloat(precioSugerido.toFixed(2))
    };
  }).sort((a, b) => a.modelo.localeCompare(b.modelo));
}

export async function obtenerVentas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ventas")
    .select(`
      *,
      cliente:clientes(nombre_local)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ventas:", error);
    return [];
  }

  return data as (Venta & { cliente?: { nombre_local: string } | null })[];
}

export async function obtenerClientes(): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre_local", { ascending: true });

  if (error) {
    console.error("Error fetching clientes:", error);
    return [];
  }

  return data as Cliente[];
}

export async function obtenerClientePorId(id: string): Promise<Cliente | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching cliente:", error);
    return null;
  }
  return data as Cliente;
}

export async function obtenerMovimientosCC(clienteId: string): Promise<MovimientoCC[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movimientos_cc")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching movimientos cc:", error);
    return [];
  }
  return data as MovimientoCC[];
}

export async function obtenerVentaPorId(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ventas")
    .select(`
      *,
      cliente:clientes(nombre_local),
      items:venta_items(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching venta:", error);
    return null;
  }
  return data;
}

export async function obtenerDevoluciones() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("devoluciones")
    .select(`
      *,
      venta_item:venta_items(
        modelo,
        precio_unitario_venta,
        venta:ventas(
          cliente:clientes(nombre_local)
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching devoluciones:", error);
    return [];
  }
  return data;
}

export async function obtenerConfiguracionAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("margen_publico_defecto")
    .eq("id", user.id)
    .single();

  return data;
}

export async function obtenerCatalogoAgrupado(): Promise<CatalogoItem[]> {
  const supabase = await createClient();
  
  // Obtener stock actual
  const { data: stockData, error: stockError } = await supabase
    .from("importacion_items")
    .select("modelo, sku, marca, categoria, cantidad_disponible, costo_real_unitario")
    .gt("cantidad_disponible", 0);

  if (stockError) {
    console.error("Error fetching stock:", stockError);
    return [];
  }

  // Agrupar stock y calcular costo promedio ponderado
  const agrupado: Record<string, CatalogoItem> = {};
  for (const item of stockData) {
    const key = `${item.modelo}`;
    if (!agrupado[key]) {
      agrupado[key] = {
        modelo: item.modelo,
        sku: item.sku,
        marca: item.marca,
        categoria: item.categoria,
        cantidad_disponible: 0,
        costo_real_unitario_promedio: 0,
        imagen_url: null,
      };
    }
    
    // Costo promedio = ( (costo_promedio_anterior * cant_anterior) + (costo_nuevo * cant_nueva) ) / cant_total
    const cantAnterior = agrupado[key].cantidad_disponible;
    const costoAnterior = agrupado[key].costo_real_unitario_promedio;
    const cantNueva = item.cantidad_disponible;
    const costoNuevo = item.costo_real_unitario;
    
    agrupado[key].cantidad_disponible += cantNueva;
    agrupado[key].costo_real_unitario_promedio = 
      ((costoAnterior * cantAnterior) + (costoNuevo * cantNueva)) / agrupado[key].cantidad_disponible;
  }

  const catalogo = Object.values(agrupado);

  if (catalogo.length === 0) return [];

  // Obtener imágenes
  const modelosUnicos = catalogo.map(c => c.modelo);
  const { data: imagesData, error: imagesError } = await supabase
    .from("productos_catalogo")
    .select("modelo, imagen_url")
    .in("modelo", modelosUnicos);

  if (!imagesError && imagesData) {
    for (const img of imagesData) {
      const item = catalogo.find(c => c.modelo === img.modelo);
      if (item) {
        // En supabase storage public, generamos url
        if (img.imagen_url) {
          const { data } = supabase.storage.from("catalogo_imagenes").getPublicUrl(img.imagen_url);
          item.imagen_url = data.publicUrl;
        }
      }
    }
  }

  return catalogo.sort((a, b) => a.modelo.localeCompare(b.modelo));
}
