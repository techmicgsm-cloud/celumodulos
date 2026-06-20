"use client";

import { useRef } from "react";
import { FileUp, X, FileCheck2 } from "lucide-react";

export function FacturaUpload({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-white/15 bg-bg-recessed px-4 py-8 text-center hover:border-copper/50 transition-colors"
        >
          <FileUp size={20} strokeWidth={1.5} className="text-text-muted" />
          <span className="text-sm text-text-secondary">
            Hacé clic para cargar la factura
          </span>
          <span className="text-xs text-text-muted">PDF, JPG o PNG</span>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-bg-recessed px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileCheck2 size={17} strokeWidth={1.75} className="text-signal-green shrink-0" />
            <span className="text-sm text-text-primary truncate">{file.name}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-text-muted hover:text-signal-red shrink-0"
            aria-label="Quitar archivo"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}
