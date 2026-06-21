-- ============================================================================
-- Voltrix ERP v2 — Esquema Definitivo de Producción + Módulo de Ventas FIFO
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Tabla: profiles
-- Almacena información adicional de cada usuario vinculada a Supabase Auth.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  margen_publico_defecto numeric(5,2) not null default 40.00
);

-- ----------------------------------------------------------------------------
-- 2. Trigger para crear Profile automáticamente al registrarse
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. Tabla: importaciones
-- ----------------------------------------------------------------------------
create table if not exists public.importaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  nombre text,
  notas text,
  factura_url text, -- Deprecado a favor de URLs firmadas
  factura_nombre_archivo text,
  factura_path text,
  total_usd_mercaderia numeric(14, 2) not null check (total_usd_mercaderia > 0),
  gasto_total_pesos numeric(14, 2) not null check (gasto_total_pesos > 0),
  factor numeric(14, 6) not null
);

-- ----------------------------------------------------------------------------
-- 4. Tabla: importacion_items
-- ----------------------------------------------------------------------------
create table if not exists public.importacion_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  importacion_id uuid not null references public.importaciones(id) on delete cascade,
  created_at timestamptz not null default now(),
  
  -- Clasificación
  marca text,
  categoria text,
  modelo text not null,
  sku text,
  
  -- Cantidades (FIFO)
  cantidad_inicial integer not null check (cantidad_inicial > 0),
  cantidad_disponible integer not null check (cantidad_disponible >= 0),
  
  -- Costos
  precio_usd_unitario numeric(14, 4) not null check (precio_usd_unitario > 0),
  costo_real_unitario numeric(14, 4) not null,
  valor_total numeric(14, 2) not null
);

-- ----------------------------------------------------------------------------
-- 5. MÓDULO DE CLIENTES (Técnicos / Gremios)
-- ----------------------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  numero_cliente serial,
  nombre_local text not null,
  telefono text,
  email text,
  direccion text,
  notas text,
  saldo_actual numeric(14, 2) not null default 0
);

-- ----------------------------------------------------------------------------
-- 6. MÓDULO DE VENTAS (Nuevas tablas)
-- ----------------------------------------------------------------------------

-- Tabla: ventas
create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_nombre text, -- Deprecado o para Consumidor Final
  metodo_pago text not null default 'efectivo' check (metodo_pago in ('efectivo', 'transferencia', 'cuenta_corriente')),
  notas text,
  total_venta numeric(14, 2) not null check (total_venta >= 0),
  total_costo numeric(14, 2) not null check (total_costo >= 0),
  ganancia_neta numeric(14, 2) not null
);

-- Tabla: venta_items
create table if not exists public.venta_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  modelo text not null,
  sku text,
  cantidad integer not null check (cantidad > 0),
  precio_unitario_venta numeric(14, 2) not null,
  costo_total_item numeric(14, 2) not null,
  ganancia_item numeric(14, 2) not null
);

-- Tabla: venta_item_lotes (Trazabilidad FIFO)
create table if not exists public.venta_item_lotes (
  id uuid primary key default gen_random_uuid(),
  venta_item_id uuid not null references public.venta_items(id) on delete cascade,
  importacion_item_id uuid not null references public.importacion_items(id),
  cantidad_tomada integer not null check (cantidad_tomada > 0),
  costo_unitario_real numeric(14, 4) not null
);

-- ----------------------------------------------------------------------------
-- 6.1 MÓDULO DE DEVOLUCIONES Y CUENTA CORRIENTE
-- ----------------------------------------------------------------------------

-- Tabla: movimientos_cc
create table if not exists public.movimientos_cc (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  created_at timestamptz not null default now(),
  monto numeric(14, 2) not null, -- Positivo (a favor), Negativo (gasto/pago)
  concepto text not null,
  referencia_id uuid -- Puede ser venta_id, devolucion_id, etc.
);

-- Tabla: devoluciones
create table if not exists public.devoluciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  venta_item_id uuid not null references public.venta_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  cantidad integer not null check (cantidad > 0),
  estado text not null check (estado in ('bueno', 'fallado')),
  monto_acreditado numeric(14, 2) not null
);

-- Tabla: movimientos_caja (Ingresos y Egresos manuales)
create table if not exists public.movimientos_caja (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  monto numeric(14, 2) not null check (monto > 0),
  metodo_pago text not null default 'efectivo',
  concepto text not null
);

-- Tabla: productos_catalogo
create table if not exists public.productos_catalogo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  modelo text not null,
  imagen_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, modelo)
);

-- ----------------------------------------------------------------------------
-- 7. Función RPC: registrar_venta_fifo
-- Esta función procesa el carrito, descuenta el stock usando FIFO y registra la venta de forma atómica.
-- ----------------------------------------------------------------------------
create or replace function public.registrar_venta_fifo(
  p_user_id uuid,
  p_cliente_id uuid,
  p_cliente_nombre text,
  p_notas text,
  p_items jsonb, -- Formato: [{ "modelo": "...", "sku": "...", "cantidad": X, "precio_venta_unitario": Y }]
  p_saldo_a_descontar numeric default 0,
  p_metodo_pago text default 'efectivo'
)
returns json as $$
declare
  v_venta_id uuid;
  v_item jsonb;
  
  v_modelo text;
  v_sku text;
  v_cantidad_necesitada integer;
  v_precio_venta numeric(14,2);
  
  v_costo_total_item numeric(14,2);
  v_ganancia_item numeric(14,2);
  
  v_lote record;
  v_cantidad_a_tomar integer;
  v_costo_lote numeric(14,4);
  v_venta_item_id uuid;
  
  v_total_venta_global numeric(14,2) := 0;
  v_total_costo_global numeric(14,2) := 0;
begin
  -- Crear el registro maestro de Venta primero (con totales 0)
  insert into public.ventas (user_id, cliente_id, cliente_nombre, notas, total_venta, total_costo, ganancia_neta, metodo_pago)
  values (p_user_id, p_cliente_id, p_cliente_nombre, p_notas, 0, 0, 0, p_metodo_pago)
  returning id into v_venta_id;

  -- Iterar sobre el carrito
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_modelo := v_item->>'modelo';
    v_sku := v_item->>'sku';
    v_cantidad_necesitada := (v_item->>'cantidad')::integer;
    v_precio_venta := (v_item->>'precio_venta_unitario')::numeric;
    
    v_costo_total_item := 0;
    v_ganancia_item := 0;
    
    -- Insertar el ítem de venta vacío temporalmente
    insert into public.venta_items (venta_id, user_id, modelo, sku, cantidad, precio_unitario_venta, costo_total_item, ganancia_item)
    values (v_venta_id, p_user_id, v_modelo, v_sku, v_cantidad_necesitada, v_precio_venta, 0, 0)
    returning id into v_venta_item_id;

    -- LÓGICA FIFO
    -- Buscar lotes que tengan el mismo modelo (y sku si aplica) con stock disponible, ordenados por fecha ascendente (los más viejos primero)
    for v_lote in 
      select * from public.importacion_items 
      where user_id = p_user_id 
        and modelo = v_modelo
        and (v_sku is null or sku = v_sku or (sku is null and v_sku = ''))
        and cantidad_disponible > 0
      order by created_at asc
      for update -- Bloqueo de fila para concurrencia segura
    loop
      exit when v_cantidad_necesitada <= 0;
      
      -- Cuánto podemos tomar de este lote
      if v_lote.cantidad_disponible >= v_cantidad_necesitada then
        v_cantidad_a_tomar := v_cantidad_necesitada;
      else
        v_cantidad_a_tomar := v_lote.cantidad_disponible;
      end if;
      
      v_costo_lote := v_cantidad_a_tomar * v_lote.costo_real_unitario;
      v_costo_total_item := v_costo_total_item + v_costo_lote;
      
      -- Descontar del lote
      update public.importacion_items 
      set cantidad_disponible = cantidad_disponible - v_cantidad_a_tomar
      where id = v_lote.id;
      
      -- Registrar trazabilidad
      insert into public.venta_item_lotes (venta_item_id, importacion_item_id, cantidad_tomada, costo_unitario_real)
      values (v_venta_item_id, v_lote.id, v_cantidad_a_tomar, v_lote.costo_real_unitario);
      
      v_cantidad_necesitada := v_cantidad_necesitada - v_cantidad_a_tomar;
    end loop;
    
    -- Verificar si alcanzó el stock
    if v_cantidad_necesitada > 0 then
      raise exception 'Stock insuficiente para el producto: %', v_modelo;
    end if;

    -- Calcular ganancias de este ítem
    v_ganancia_item := (v_cantidad_a_tomar * v_precio_venta) - v_costo_total_item; -- wait, it's (total_cantidad * precio) - costo
    -- Corrección ganancia:
    v_ganancia_item := ((v_item->>'cantidad')::integer * v_precio_venta) - v_costo_total_item;
    
    -- Actualizar el ítem de venta
    update public.venta_items
    set costo_total_item = v_costo_total_item,
        ganancia_item = v_ganancia_item
    where id = v_venta_item_id;

    -- Acumular globales
    v_total_venta_global := v_total_venta_global + ((v_item->>'cantidad')::integer * v_precio_venta);
    v_total_costo_global := v_total_costo_global + v_costo_total_item;

  end loop;

  -- Actualizar totales en la venta global
  update public.ventas
  set total_venta = v_total_venta_global,
      total_costo = v_total_costo_global,
      ganancia_neta = v_total_venta_global - v_total_costo_global
  where id = v_venta_id;

  if p_saldo_a_descontar > 0 and p_cliente_id is not null then
    declare
      v_saldo_cliente numeric;
    begin
      select saldo_actual into v_saldo_cliente from public.clientes where id = p_cliente_id and user_id = p_user_id;
      if v_saldo_cliente < p_saldo_a_descontar then
        raise exception 'Saldo insuficiente en la cuenta del cliente.';
      end if;
      
      update public.clientes set saldo_actual = saldo_actual - p_saldo_a_descontar where id = p_cliente_id;
      
      insert into public.movimientos_cc (user_id, cliente_id, monto, concepto, referencia_id)
      values (p_user_id, p_cliente_id, -p_saldo_a_descontar, 'Pago parcial con saldo a favor Venta #' || substr(v_venta_id::text, 1, 8), v_venta_id);
    end;
  end if;

  -- NUEVO: Si el método de pago es cuenta_corriente, el resto se descuenta del saldo (generando deuda si no hay saldo suficiente)
  if p_metodo_pago = 'cuenta_corriente' and p_cliente_id is not null then
    declare
      v_deuda_restante numeric;
    begin
      v_deuda_restante := v_total_venta_global - coalesce(p_saldo_a_descontar, 0);
      if v_deuda_restante > 0 then
        update public.clientes set saldo_actual = saldo_actual - v_deuda_restante where id = p_cliente_id;
        
        insert into public.movimientos_cc (user_id, cliente_id, monto, concepto, referencia_id)
        values (p_user_id, p_cliente_id, -v_deuda_restante, 'Venta a Cuenta Corriente #' || substr(v_venta_id::text, 1, 8), v_venta_id);
      end if;
    end;
  end if;

  return json_build_object('success', true, 'venta_id', v_venta_id);
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- 7.1 Función RPC: registrar_devolucion
-- ----------------------------------------------------------------------------
create or replace function public.registrar_devolucion(
  p_user_id uuid,
  p_venta_item_id uuid,
  p_cantidad integer,
  p_estado text -- 'bueno' o 'fallado'
)
returns json as $$
declare
  v_venta_item record;
  v_venta record;
  v_cliente_id uuid;
  v_monto_acreditado numeric(14,2);
  v_devolucion_id uuid;
  v_lotes_tomados cursor for 
    select * from public.venta_item_lotes 
    where venta_item_id = p_venta_item_id 
    order by id desc; -- Devolver a los últimos lotes tomados
  v_lote record;
  v_cantidad_restante integer;
  v_cantidad_a_devolver integer;
  v_costo_reducido numeric(14,2) := 0;
begin
  -- 1. Obtener información de la venta e ítem
  select * into v_venta_item from public.venta_items where id = p_venta_item_id and user_id = p_user_id;
  if not found then
    raise exception 'Venta item no encontrado.';
  end if;
  
  if v_venta_item.cantidad < p_cantidad then
    raise exception 'La cantidad a devolver es mayor que la cantidad vendida.';
  end if;

  select * into v_venta from public.ventas where id = v_venta_item.venta_id and user_id = p_user_id;
  v_cliente_id := v_venta.cliente_id;
  
  -- Calcular monto a acreditar (precio unitario en el que se vendió * cantidad)
  v_monto_acreditado := v_venta_item.precio_unitario_venta * p_cantidad;

  -- 2. Crear registro de devolución
  insert into public.devoluciones (user_id, venta_item_id, cantidad, estado, monto_acreditado)
  values (p_user_id, p_venta_item_id, p_cantidad, p_estado, v_monto_acreditado)
  returning id into v_devolucion_id;

  -- 3. Actualizar cuenta corriente si hay cliente
  if v_cliente_id is not null then
    update public.clientes set saldo_actual = saldo_actual + v_monto_acreditado where id = v_cliente_id;
    
    insert into public.movimientos_cc (user_id, cliente_id, monto, concepto, referencia_id)
    values (p_user_id, v_cliente_id, v_monto_acreditado, 'Devolución de módulo: ' || v_venta_item.modelo, v_devolucion_id);
  end if;

  -- 4. Si el estado es 'bueno', devolver al stock
  if p_estado = 'bueno' then
    v_cantidad_restante := p_cantidad;
    
    for v_lote in v_lotes_tomados loop
      exit when v_cantidad_restante <= 0;
      
      if v_lote.cantidad_tomada >= v_cantidad_restante then
        v_cantidad_a_devolver := v_cantidad_restante;
      else
        v_cantidad_a_devolver := v_lote.cantidad_tomada;
      end if;
      
      -- Devolver al stock original de importacion_items
      update public.importacion_items 
      set cantidad_disponible = cantidad_disponible + v_cantidad_a_devolver 
      where id = v_lote.importacion_item_id;
      
      -- Acumular el costo original para descontar de las ganancias
      v_costo_reducido := v_costo_reducido + (v_cantidad_a_devolver * v_lote.costo_unitario_real);
      
      v_cantidad_restante := v_cantidad_restante - v_cantidad_a_devolver;
    end loop;
    
    -- Ajustar la venta original
    update public.venta_items
    set cantidad = cantidad - p_cantidad,
        costo_total_item = costo_total_item - v_costo_reducido,
        ganancia_item = ganancia_item - (v_monto_acreditado - v_costo_reducido)
    where id = p_venta_item_id;
    
    update public.ventas
    set total_venta = total_venta - v_monto_acreditado,
        total_costo = total_costo - v_costo_reducido,
        ganancia_neta = ganancia_neta - (v_monto_acreditado - v_costo_reducido)
    where id = v_venta.id;
  end if;

  return json_build_object('success', true, 'devolucion_id', v_devolucion_id);
end;
$$ language plpgsql security definer;

-- ----------------------------------------------------------------------------
-- 7.2 Función RPC: get_public_catalog
-- ----------------------------------------------------------------------------
create or replace function public.get_public_catalog(p_user_id uuid)
returns json as $$
declare
  v_result json;
begin
  select json_agg(
    json_build_object(
      'modelo', grouped.modelo,
      'sku', grouped.sku,
      'marca', grouped.marca,
      'categoria', grouped.categoria,
      'cantidad_disponible', grouped.total_disp,
      'precio_publico', (grouped.costo_promedio * (1 + (coalesce((select margen_publico_defecto from public.profiles where id = p_user_id), 40) / 100))),
      'imagen_url', (select imagen_url from public.productos_catalogo pc where pc.modelo = grouped.modelo and pc.user_id = p_user_id limit 1)
    )
  )
  into v_result
  from (
    select 
      modelo, sku, marca, categoria,
      sum(cantidad_disponible) as total_disp,
      sum(cantidad_disponible * costo_real_unitario) / sum(cantidad_disponible) as costo_promedio
    from public.importacion_items
    where user_id = p_user_id and cantidad_disponible > 0
    group by modelo, sku, marca, categoria
  ) grouped;

  return coalesce(v_result, '[]'::json);
end;
$$ language plpgsql security definer;


-- ----------------------------------------------------------------------------
-- 8. Índices
-- ----------------------------------------------------------------------------
create index if not exists idx_importaciones_user_id on public.importaciones (user_id);
create index if not exists idx_importaciones_created_at on public.importaciones (created_at desc);

create index if not exists idx_importacion_items_user_id on public.importacion_items (user_id);
create index if not exists idx_importacion_items_importacion_id on public.importacion_items (importacion_id);
create index if not exists idx_importacion_items_modelo on public.importacion_items (modelo);
create index if not exists idx_importacion_items_sku on public.importacion_items (sku);

create index if not exists idx_clientes_user_id on public.clientes(user_id);
create index if not exists idx_ventas_user_id on public.ventas(user_id);
create index if not exists idx_ventas_cliente_id on public.ventas(cliente_id);
create index if not exists idx_venta_items_venta_id on public.venta_items(venta_id);
create index if not exists idx_venta_item_lotes_venta_item_id on public.venta_item_lotes(venta_item_id);

create index if not exists idx_movimientos_cc_user_id on public.movimientos_cc(user_id);
create index if not exists idx_movimientos_cc_cliente_id on public.movimientos_cc(cliente_id);
create index if not exists idx_devoluciones_user_id on public.devoluciones(user_id);
create index if not exists idx_devoluciones_venta_item_id on public.devoluciones(venta_item_id);

create index if not exists idx_movimientos_caja_user_id on public.movimientos_caja(user_id);

-- ----------------------------------------------------------------------------
-- 9. Configuración del Bucket de facturas (STORAGE)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('facturas', 'facturas', false)
on conflict (id) do update set public = false;

-- ----------------------------------------------------------------------------
-- 10. Políticas de Row Level Security (RLS) Completas
-- ----------------------------------------------------------------------------

-- Habilitar RLS en todas las tablas
alter table public.profiles enable row level security;
alter table public.importaciones enable row level security;
alter table public.importacion_items enable row level security;
alter table public.clientes enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_items enable row level security;
alter table public.venta_item_lotes enable row level security;
alter table public.movimientos_cc enable row level security;
alter table public.devoluciones enable row level security;
alter table public.movimientos_caja enable row level security;
alter table public.productos_catalogo enable row level security;

-- Limpiar políticas anteriores por precaución
drop policy if exists "Usuarios pueden ver su propio perfil" on public.profiles;
drop policy if exists "Usuarios pueden editar su propio perfil" on public.profiles;
drop policy if exists "Aislamiento total de importaciones" on public.importaciones;
drop policy if exists "Aislamiento total de items" on public.importacion_items;
drop policy if exists "Aislamiento clientes" on public.clientes;
drop policy if exists "Aislamiento ventas" on public.ventas;
drop policy if exists "Aislamiento venta items" on public.venta_items;
drop policy if exists "Aislamiento venta item lotes" on public.venta_item_lotes;
drop policy if exists "Aislamiento movimientos_cc" on public.movimientos_cc;
drop policy if exists "Aislamiento devoluciones" on public.devoluciones;
drop policy if exists "Aislamiento movimientos_caja" on public.movimientos_caja;
drop policy if exists "Aislamiento productos_catalogo" on public.productos_catalogo;
drop policy if exists "Aislamiento productos_catalogo (public)" on public.productos_catalogo;
drop policy if exists "Acceso a facturas propias" on storage.objects;
drop policy if exists "Subida de facturas propias" on storage.objects;
drop policy if exists "Borrado de facturas propias" on storage.objects;

-- Políticas: perfiles
create policy "Usuarios pueden ver su propio perfil" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Usuarios pueden editar su propio perfil" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Políticas: importaciones
create policy "Aislamiento total de importaciones" 
  on public.importaciones for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas: importacion_items
create policy "Aislamiento total de items" 
  on public.importacion_items for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas: Clientes
create policy "Aislamiento clientes" 
  on public.clientes for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas: Ventas
create policy "Aislamiento ventas" 
  on public.ventas for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Aislamiento venta items" 
  on public.venta_items for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Aislamiento venta item lotes" 
  on public.venta_item_lotes for all 
  using (
    exists (
      select 1 from public.venta_items 
      where id = venta_item_lotes.venta_item_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.venta_items 
      where id = venta_item_lotes.venta_item_id and user_id = auth.uid()
    )
  );

-- Políticas: Cuenta Corriente, Devoluciones y Caja
create policy "Aislamiento movimientos_cc" 
  on public.movimientos_cc for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Aislamiento devoluciones" 
  on public.devoluciones for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Aislamiento movimientos_caja" 
  on public.movimientos_caja for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Aislamiento productos_catalogo" 
  on public.productos_catalogo for all 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Aislamiento productos_catalogo (public)" 
  on public.productos_catalogo for select 
  using (true);

-- Políticas: Storage (Bucket "facturas")
create policy "Acceso a facturas propias"
  on storage.objects for select
  using (
    bucket_id = 'facturas' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Subida de facturas propias"
  on storage.objects for insert
  with check (
    bucket_id = 'facturas' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Borrado de facturas propias"
  on storage.objects for delete
  using (
    bucket_id = 'facturas' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Configuración del Bucket de Catálogo
insert into storage.buckets (id, name, public) 
values ('catalogo_imagenes', 'catalogo_imagenes', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Access Catalogo Imagenes" on storage.objects;
drop policy if exists "Upload Catalogo Imagenes" on storage.objects;
drop policy if exists "Delete Catalogo Imagenes" on storage.objects;

create policy "Public Access Catalogo Imagenes"
  on storage.objects for select
  using ( bucket_id = 'catalogo_imagenes' );

create policy "Upload Catalogo Imagenes"
  on storage.objects for insert
  with check (
    bucket_id = 'catalogo_imagenes' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Delete Catalogo Imagenes"
  on storage.objects for delete
  using (
    bucket_id = 'catalogo_imagenes' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
