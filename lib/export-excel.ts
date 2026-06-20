import * as XLSX from "xlsx";
import { MARGENES, type Importacion, type ImportacionItem } from "@/lib/types";
import { calcularPreciosSugeridos, formatFecha } from "@/lib/calculations";

function descargar(wb: XLSX.WorkBook, nombreArchivo: string) {
  XLSX.writeFile(wb, nombreArchivo);
}

function filasModelos(modelos: ImportacionItem[]) {
  return modelos.map((m) => {
    const sugeridos = calcularPreciosSugeridos(m.costo_real_unitario);
    const fila: Record<string, string | number> = {
      SKU: m.sku || "-",
      Marca: m.marca || "-",
      Categoría: m.categoria || "-",
      Modelo: m.modelo,
      Cantidad: m.cantidad_disponible,
      "Precio USD unitario": Number(m.precio_usd_unitario.toFixed(2)),
      "Costo real unitario (ARS)": Number(m.costo_real_unitario.toFixed(2)),
      "Valor total (ARS)": Number(m.valor_total.toFixed(2)),
    };
    for (const margen of MARGENES) {
      fila[`PV ${margen}% (ARS)`] = Number(sugeridos[margen].toFixed(2));
    }
    return fila;
  });
}

/** Exporta el historial completo de importaciones a un .xlsx. */
export function exportarHistorialExcel(importaciones: Importacion[]) {
  const filas = importaciones.map((imp) => ({
    Fecha: formatFecha(imp.created_at),
    Nombre: imp.nombre ?? "Sin nombre",
    "Total USD mercadería": Number(imp.total_usd_mercaderia.toFixed(2)),
    "Gasto total (ARS)": Number(imp.gasto_total_pesos.toFixed(2)),
    Factor: Number(imp.factor.toFixed(4)),
  }));

  const ws = XLSX.utils.json_to_sheet(filas);
  ws["!cols"] = [
    { wch: 12 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Historial");
  descargar(wb, `historial-importaciones-${Date.now()}.xlsx`);
}

/** Exporta el detalle de una importación (datos generales + modelos) a un .xlsx. */
export function exportarImportacionExcel(
  importacion: Importacion,
  modelos: ImportacionItem[]
) {
  const wb = XLSX.utils.book_new();

  const resumen = [
    { Campo: "Nombre", Valor: importacion.nombre ?? "Sin nombre" },
    { Campo: "Fecha", Valor: formatFecha(importacion.created_at) },
    {
      Campo: "Total USD mercadería",
      Valor: Number(importacion.total_usd_mercaderia.toFixed(2)),
    },
    {
      Campo: "Gasto total (ARS)",
      Valor: Number(importacion.gasto_total_pesos.toFixed(2)),
    },
    { Campo: "Factor", Valor: Number(importacion.factor.toFixed(4)) },
  ];
  const wsResumen = XLSX.utils.json_to_sheet(resumen, { skipHeader: false });
  wsResumen["!cols"] = [{ wch: 24 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  const wsModelos = XLSX.utils.json_to_sheet(filasModelos(modelos));
  wsModelos["!cols"] = [
    { wch: 15 }, // SKU
    { wch: 15 }, // Marca
    { wch: 15 }, // Categoria
    { wch: 26 }, // Modelo
    { wch: 10 }, // Cantidad
    { wch: 16 }, // Precio USD
    { wch: 20 }, // Costo real
    { wch: 16 }, // Valor total
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsModelos, "Modelos");

  const nombreArchivo = (importacion.nombre ?? "importacion")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  descargar(wb, `${nombreArchivo}-${Date.now()}.xlsx`);
}
