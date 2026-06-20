import Link from "next/link";
import { PackageX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <PackageX size={28} strokeWidth={1.5} className="text-text-muted mb-4" />
      <h1 className="text-base font-semibold text-text-primary">
        No encontramos esa importación
      </h1>
      <p className="text-sm text-text-muted mt-1.5 max-w-sm">
        Puede que el enlace esté roto o que la importación haya sido eliminada.
      </p>
      <Link
        href="/importaciones"
        className="text-sm text-copper hover:text-copper-bright mt-4"
      >
        Volver al historial
      </Link>
    </div>
  );
}
