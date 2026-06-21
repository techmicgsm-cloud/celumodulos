"use client";

import { useState } from "react";
import { login, signup } from "./actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Boxes } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = isLogin ? await login(formData) : await signup(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (e) {
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="h-12 w-12 rounded-xl bg-copper/10 flex items-center justify-center text-copper">
            <Boxes size={24} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Voltrix ERP
          </h1>
          <p className="text-text-muted text-sm">
            Gestión de importaciones y stock
          </p>
        </div>

        <Card>
          <CardHeader
            title={isLogin ? "Iniciar sesión" : "Crear cuenta"}
            description={
              isLogin
                ? "Ingresa tus credenciales para acceder"
                : "Registrate para comenzar a gestionar tus importaciones"
            }
          />
          <div className="p-4 sm:p-6 pt-0">
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">
                  Contraseña
                </label>
                <Input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading
                  ? "Cargando..."
                  : isLogin
                  ? "Entrar al sistema"
                  : "Registrarse"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-text-muted">
              {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-copper hover:text-copper-bright hover:underline"
              >
                {isLogin ? "Regístrate aquí" : "Inicia sesión aquí"}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
