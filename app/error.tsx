"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="font-sans antialiased min-h-screen bg-bg-base text-text-primary flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-signal-red/10 text-signal-red mx-auto mb-4">
            <AlertTriangle size={22} strokeWidth={1.75} />
          </div>
          <h1 className="text-base font-semibold mb-2">Ocurrió un error al cargar los datos</h1>
          <p className="text-sm text-text-muted mb-1">{error.message}</p>
          <p className="text-xs text-text-muted mb-6">
            Si es la primera vez que ejecutás la app, revisá que tu archivo .env.local
            tenga las variables de Supabase configuradas correctamente.
          </p>
          <Button onClick={() => reset()} variant="secondary">
            Reintentar
          </Button>
        </div>
      </body>
    </html>
  );
}
