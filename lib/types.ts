export interface Importacion {
  id: string;
  user_id: string;
  created_at: string;
  nombre: string | null;
  factura_url: string | null; // legacy
  factura_path: string | null;
  factura_nombre_archivo: string | null;
  total_usd_mercaderia: number;
  gasto_total_pesos: number;
  factor: number;
  notas: string | null;
}

export interface ImportacionItem {
  id: string;
  user_id: string;
  importacion_id: string;
  marca: string | null;
  categoria: string | null;
  modelo: string;
  sku: string | null;
  cantidad_inicial: number;
  cantidad_disponible: number;
  precio_usd_unitario: number;
  costo_real_unitario: number;
  valor_total: number;
  created_at: string;
}

export interface ModeloItem extends ImportacionItem {
  cantidad: number;
}

export interface ImportacionConModelos extends Importacion {
  modelos: ModeloItem[];
}

/** Fila editable en el formulario de nueva importación, antes de persistir. */
export interface ModeloFormInput {
  clienteId: string; // id temporal solo para el formulario (key de React)
  marca: string;
  categoria: string;
  modelo: string;
  sku: string;
  cantidad: number;
  precioUsdUnitario: number;
}

export const MARGENES = [20, 30, 40, 50, 100] as const;
export type Margen = (typeof MARGENES)[number];
export interface Cliente {
  id: string;
  user_id: string;
  created_at: string;
  numero_cliente: number;
  nombre_local: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  saldo_actual: number;
}

export interface Venta {
  id: string;
  user_id: string;
  created_at: string;
  cliente_id: string | null;
  cliente_nombre: string | null;
  notas: string | null;
  total_venta: number;
  total_costo: number;
  ganancia_neta: number;
}

export interface VentaItem {
  id: string;
  venta_id: string;
  modelo: string;
  sku: string | null;
  cantidad: number;
  precio_unitario_venta: number;
  costo_total_item: number;
  ganancia_item: number;
}

export interface StockAgrupado {
  modelo: string;
  sku: string | null;
  marca: string | null;
  categoria: string | null;
  cantidad_disponible: number;
  precio_sugerido?: number;
}

export interface CatalogoItem extends StockAgrupado {
  costo_real_unitario_promedio: number;
  imagen_url: string | null;
}

export interface MovimientoCC {
  id: string;
  user_id: string;
  cliente_id: string;
  created_at: string;
  monto: number;
  concepto: string;
  referencia_id: string | null;
}

export interface Devolucion {
  id: string;
  user_id: string;
  venta_item_id: string;
  created_at: string;
  cantidad: number;
  estado: 'bueno' | 'fallado';
  monto_acreditado: number;
}
