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
  cliente: any | null
) {
  // Formato ticket térmico (80mm ancho, largo dinámico aproximado 297mm)
  const doc = new jsPDF({ format: [80, 297], unit: "mm" });
  
  // Encabezado simple centrado
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Voltrix ERP", 40, 12, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Comprobante de Venta", 40, 18, { align: "center" });
  doc.setFontSize(8);
  doc.text(`Fecha: ${formatFecha(venta.created_at)}`, 40, 23, { align: "center" });
  doc.text(`Ticket #${venta.id.split('-')[0].toUpperCase()}`, 40, 27, { align: "center" });
  
  // Línea punteada
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, 30, 75, 30);
  doc.setLineDashPattern([], 0);

  // Datos del cliente
  doc.setFontSize(8);
  const clienteStr = cliente ? `[#${String(cliente.numero_cliente).padStart(4, '0')}] ${cliente.nombre_local}` : "Consumidor Final";
  doc.text(`Cliente: ${clienteStr}`, 5, 35);
  
  const metodoPago = venta.metodo_pago === 'cuenta_corriente' ? 'Fiado (C.C.)' : (venta.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo');
  doc.text(`Pago: ${metodoPago}`, 5, 40);

  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, 43, 75, 43);
  doc.setLineDashPattern([], 0);

  // Tabla de items usando autoTable ajustado para ticket
  autoTable(doc, {
    startY: 45,
    margin: { left: 5, right: 5 },
    theme: "plain",
    head: [["Cant", "Articulo", "Total"]],
    body: items.map((item) => {
      const subtotalArs = item.cantidad * (item.precio_unitario_venta || item.precio_venta_unitario || 0);
      
      // Intentar armar un nombre descriptivo ("Módulo Samsung A02")
      let nombreLargo = item.modelo;
      if (item.marca || item.categoria) {
        nombreLargo = `${item.categoria || ""} ${item.marca || ""} ${item.modelo}`.trim();
      } else if (item.lotes && item.lotes.length > 0 && item.lotes[0].importacion_item) {
        const cat = item.lotes[0].importacion_item.categoria;
        const mar = item.lotes[0].importacion_item.marca;
        nombreLargo = `${cat || ""} ${mar || ""} ${item.modelo}`.trim();
      }

      return [
        String(item.cantidad),
        nombreLargo.substring(0, 30), // Truncar nombre muy largo (aumentado a 30 caracteres)
        formatARS(subtotalArs),
      ];
    }),
    headStyles: { fontSize: 8, fontStyle: "bold", textColor: [0, 0, 0], halign: "left" },
    bodyStyles: { fontSize: 8, textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25, halign: "right" },
    },
  });

  const tableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, tableY + 2, 75, tableY + 2);
  doc.setLineDashPattern([], 0);

  // Total
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", 5, tableY + 8);
  doc.text(formatARS(venta.total_venta), 75, tableY + 8, { align: "right" });

  let finalY = tableY + 14;
  if (venta.notas) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const splitNotas = doc.splitTextToSize(`Notas: ${venta.notas}`, 70);
    doc.text(splitNotas, 5, finalY);
    finalY += splitNotas.length * 4;
  }
  
  // Pie de ticket
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, finalY, 75, finalY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("¡Gracias por su compra!", 40, finalY + 5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Los equipos deben ser probados antes de", 40, finalY + 9, { align: "center" });
  doc.text("su instalación. No se aceptan reclamos", 40, finalY + 12, { align: "center" });
  doc.text("sin los films ni los sellos correspondientes.", 40, finalY + 15, { align: "center" });

  doc.save(`venta-${venta.id.split('-')[0]}-${Date.now()}.pdf`);
}
