# CeluImport ERP

Aplicación web para importadores de módulos de celulares: cargá la factura de
compra, ingresá los totales de la importación y la app calcula el costo real
de cada modelo y los precios de venta sugeridos. Incluye historial, dashboard
de stock/capital/ganancia y exportación a Excel y PDF.

## Stack

- **Next.js 15** (App Router, Server Actions)
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Postgres + Storage para las facturas)
- `xlsx` y `jspdf` para las exportaciones

## 1. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo.
2. Abrí **SQL Editor** y ejecutá el contenido completo de
   [`supabase/schema.sql`](./supabase/schema.sql). Esto crea:
   - la tabla `importaciones`
   - la tabla `modelos`
   - el bucket de Storage `facturas` (público, para poder visualizar las
     facturas cargadas)
   - las políticas de RLS necesarias para que la app pueda leer y escribir
3. Andá a **Project Settings > API** y copiá:
   - `Project URL`
   - `anon public` key

## 2. Configurar las variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local` con los valores que copiaste en el paso anterior:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
```

## 3. Instalar dependencias y correr en desarrollo

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## 4. Desplegar

La forma más simple es [Vercel](https://vercel.com):

1. Subí este proyecto a un repositorio de GitHub.
2. Importalo en Vercel.
3. Agregá las mismas dos variables de entorno (`NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en **Settings > Environment Variables**.
4. Deploy.

## Cómo funciona el cálculo

1. **Factor** = `gasto_total_pesos / total_usd_mercaderia`. Es el número
   central de la app: cuántos pesos "reales" representa cada dólar de
   mercadería una vez prorrateados flete, despacho e impuestos. Se muestra
   en vivo en un panel tipo instrumento mientras completás los totales.
2. Por cada modelo cargás **cantidad** y **precio USD unitario**.
3. **Costo real unitario (ARS)** = `precio_usd_unitario × factor`.
4. **Valor total del modelo (ARS)** = `costo_real_unitario × cantidad`.
5. **Precios de venta sugeridos** = `costo_real_unitario × (1 + margen)`,
   para los márgenes 20%, 30%, 40%, 50% y 100%.

Estas mismas fórmulas viven en [`lib/calculations.ts`](./lib/calculations.ts)
y se usan tanto en el formulario (cálculo en vivo) como en el servidor (al
guardar) y en las exportaciones.

## Funcionalidades

- Carga de factura de compra (PDF o imagen) a Supabase Storage.
- Ingreso de valor total de mercadería en USD y gasto total en ARS, con
  cálculo automático del factor.
- Alta de modelos con cantidad y precio USD unitario, con cálculo en vivo de
  costo real unitario, valor total y los 5 precios sugeridos.
- Historial completo de importaciones con detalle por importación.
- Dashboard con stock total, capital invertido, ganancia potencial por
  margen (interactivo) y stock agregado por modelo.
- Exportación a Excel (.xlsx) y PDF, tanto del historial completo como del
  detalle de una importación puntual.
- Diseño oscuro estilo ERP, con un panel tipo "instrumento" que muestra el
  factor en vivo.

## Notas para producción

- **Autenticación**: esta versión no incluye login; las políticas de RLS
  quedan abiertas para que cualquiera con la `anon key` pueda leer y
  escribir. Si vas a desplegarla con acceso público desde internet, agregá
  [Supabase Auth](https://supabase.com/docs/guides/auth) y restringí las
  políticas de `importaciones`, `modelos` y `storage.objects` a usuarios
  autenticados.
- **Stock vs. ventas**: el "stock" del dashboard suma todas las unidades
  importadas históricamente. Si querés que el stock se descuente a medida
  que vendés, el siguiente paso natural es agregar una tabla `ventas` que
  reste contra `modelos.cantidad`.
- La librería `xlsx` (SheetJS) instalada desde el registro de npm tiene
  advertencias de seguridad conocidas en versiones viejas. Si vas a recibir
  archivos `.xlsx` de fuentes externas (no es el caso de esta app, que solo
  *genera* Excel), revisá las recomendaciones de SheetJS para instalar desde
  su CDN propio.

## Estructura del proyecto

```
app/
  page.tsx                      Dashboard
  importaciones/page.tsx        Historial completo
  importaciones/nueva/          Formulario + Server Action de alta
  importaciones/[id]/page.tsx   Detalle de una importación
  globals.css                   Tokens de diseño (Tailwind v4 @theme)
components/
  layout/                       Sidebar y nav mobile
  ui/                           Button, Input, Card, InstrumentPanel...
  dashboard/                    StatCard, gráfico de márgenes, etc.
  importaciones/                Tablas y botones de exportación
  forms/                        Formulario de nueva importación
lib/
  calculations.ts                Factor, costo real, precios sugeridos
  export-excel.ts / export-pdf.ts
  supabase/client.ts / server.ts
  data.ts                        Consultas a Supabase
supabase/
  schema.sql                     Tablas, índices, bucket y políticas RLS
```
