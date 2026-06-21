import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MARGENES, type Importacion, type ImportacionItem } from "@/lib/types";
import {
  calcularPreciosSugeridos,
  formatARS,
  formatFecha,
  formatUSD,
} from "@/lib/calculations";

const TITULO_COLOR: [number, number, number] = [201, 118, 58]; // copper
const TEXTO_MUTED: [number, number, number] = [100, 105, 115];

function encabezado(doc: jsPDF, titulo: string, subtitulo?: string) {
  doc.setFontSize(18);
  doc.setTextColor(...TITULO_COLOR);
  doc.text(titulo, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(...TEXTO_MUTED);
  doc.text(subtitulo ?? "Voltrix ERP — Gestión de importación de módulos", 14, 25);
  doc.setTextColor(20, 20, 20);
}

/** Exporta el historial completo de importaciones a un .pdf. */
export function exportarHistorialPdf(importaciones: Importacion[]) {
  const doc = new jsPDF();
  encabezado(doc, "Historial de importaciones");

  autoTable(doc, {
    startY: 32,
    head: [["Fecha", "Nombre", "USD mercadería", "Gasto (ARS)", "Factor"]],
    body: importaciones.map((imp) => [
      formatFecha(imp.created_at),
      imp.nombre ?? "Sin nombre",
      formatUSD(imp.total_usd_mercaderia),
      formatARS(imp.gasto_total_pesos),
      imp.factor.toFixed(4),
    ]),
    headStyles: { fillColor: [20, 23, 28], textColor: [233, 231, 226] },
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`historial-importaciones-${Date.now()}.pdf`);
}

/** Exporta el detalle de una importación (datos generales + modelos) a un .pdf. */
export function exportarImportacionPdf(
  importacion: Importacion,
  modelos: ImportacionItem[]
) {
  const doc = new jsPDF();
  encabezado(doc, importacion.nombre ?? "Importación", formatFecha(importacion.created_at));

  autoTable(doc, {
    startY: 32,
    theme: "plain",
    body: [
      ["Total USD mercadería", formatUSD(importacion.total_usd_mercaderia)],
      ["Gasto total (ARS)", formatARS(importacion.gasto_total_pesos)],
      ["Factor", importacion.factor.toFixed(4)],
    ],
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", textColor: TEXTO_MUTED } },
  });

  const startY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  autoTable(doc, {
    startY: startY + 8,
    head: [
      [
        "SKU",
        "Modelo",
        "Cant.",
        "USD u.",
        "Costo real",
        "Valor total",
        "PV 20%",
        "PV 30%",
        "PV 40%",
        "PV 50%",
        "PV 100%",
      ],
    ],
    body: modelos.map((m) => {
      const sugeridos = calcularPreciosSugeridos(m.costo_real_unitario);
      return [
        m.sku || "-",
        m.marca ? `${m.marca} ${m.modelo}` : m.modelo,
        String(m.cantidad_disponible),
        formatUSD(m.precio_usd_unitario),
        formatARS(m.costo_real_unitario),
        formatARS(m.valor_total),
        ...MARGENES.map((margen) => formatARS(sugeridos[margen])),
      ];
    }),
    headStyles: { fillColor: [20, 23, 28], textColor: [233, 231, 226] },
    styles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  const nombreArchivo = (importacion.nombre ?? "importacion")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  doc.save(`${nombreArchivo}-${Date.now()}.pdf`);
}

/** Exporta un ticket de venta para el cliente */
export function exportarTicketVentaPdf(
  venta: any,
  items: any[],
  cliente: any | null,
  valorDolarArs: number
) {
  const doc = new jsPDF();
  encabezado(doc, "Comprobante de Venta", `Fecha: ${formatFecha(venta.created_at)}`);

  autoTable(doc, {
    startY: 32,
    theme: "plain",
    body: [
      ["Cliente / Técnico", cliente ? `[#${String(cliente.numero_cliente).padStart(4, '0')}] ${cliente.nombre_local}` : "Consumidor Final"],
      ["Método de Pago", venta.metodo_pago === 'cuenta_corriente' ? 'Cuenta Corriente (Fiado)' : (venta.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo')],
      ["Cotización Dólar", formatARS(valorDolarArs)],
    ],
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", textColor: TEXTO_MUTED } },
  });

  const startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: startY + 8,
    head: [["Cant.", "Modelo", "Precio Unitario (USD)", "Subtotal (USD)", "Subtotal (ARS)"]],
    body: items.map((item) => {
      const subtotalUsd = item.cantidad * item.precio_unitario_venta;
      return [
        String(item.cantidad),
        item.modelo,
        formatUSD(item.precio_unitario_venta),
        formatUSD(subtotalUsd),
        formatARS(subtotalUsd * valorDolarArs),
      ];
    }),
    headStyles: { fillColor: [20, 23, 28], textColor: [233, 231, 226] },
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  const tableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: tableY + 8,
    theme: "plain",
    body: [
      ["Total Venta", formatUSD(venta.total_venta), formatARS(venta.total_venta * valorDolarArs)],
    ],
    styles: { fontSize: 12, fontStyle: "bold" },
    columnStyles: {
      0: { textColor: TEXTO_MUTED, halign: "right" },
      1: { textColor: TITULO_COLOR, halign: "right" },
      2: { textColor: [34, 197, 94], halign: "right" },
    },
  });

  if (venta.notas) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFontSize(9);
    doc.setTextColor(...TEXTO_MUTED);
    doc.text(`Notas: ${venta.notas}`, 14, finalY + 10);
  }

  doc.save(`venta-${venta.id.split('-')[0]}-${Date.now()}.pdf`);
}
