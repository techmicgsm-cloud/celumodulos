"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Importacion, ModeloItem } from "@/lib/types";
import {
  exportarHistorialExcel,
  exportarImportacionExcel,
} from "@/lib/export-excel";
import { exportarHistorialPdf, exportarImportacionPdf } from "@/lib/export-pdf";

type Props =
  | { tipo: "historial"; importaciones: Importacion[] }
  | { tipo: "detalle"; importacion: Importacion; modelos: ModeloItem[] };

export function ExportButtons(props: Props) {
  function handleExcel() {
    if (props.tipo === "historial") {
      exportarHistorialExcel(props.importaciones);
    } else {
      exportarImportacionExcel(props.importacion, props.modelos);
    }
  }

  function handlePdf() {
    if (props.tipo === "historial") {
      exportarHistorialPdf(props.importaciones);
    } else {
      exportarImportacionPdf(props.importacion, props.modelos);
    }
  }

  const disabled =
    props.tipo === "historial"
      ? props.importaciones.length === 0
      : props.modelos.length === 0;

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={handleExcel} disabled={disabled}>
        <FileSpreadsheet size={14} strokeWidth={1.75} />
        Excel
      </Button>
      <Button variant="secondary" size="sm" onClick={handlePdf} disabled={disabled}>
        <FileText size={14} strokeWidth={1.75} />
        PDF
      </Button>
    </div>
  );
}
