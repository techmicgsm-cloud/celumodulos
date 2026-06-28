"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function subirImagenCatalogo(formData: FormData) {
  const modelo = formData.get("modelo") as string;
  const imageFile = formData.get("image") as File;

  if (!modelo || !imageFile) {
    return { error: "Modelo o imagen no válida." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuario no autenticado." };
  }

  // 1. Upload file to Storage (public bucket "catalogo_imagenes")
  // Use a unique name
  const ext = imageFile.name.split('.').pop();
  const filePath = `${user.id}/${modelo.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("catalogo_imagenes")
    .upload(filePath, imageFile, {
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading image:", uploadError);
    return { error: "Error al subir la imagen." };
  }

  // 2. Upsert into productos_catalogo
  const { error: dbError } = await supabase
    .from("productos_catalogo")
    .upsert({
      user_id: user.id,
      modelo: modelo,
      imagen_url: filePath,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id, modelo'
    });

  if (dbError) {
    console.error("Error saving image ref to DB:", dbError);
    return { error: "Error al enlazar la imagen al producto." };
  }

  revalidatePath("/catalogo");
  revalidatePath("/c/catalogo");

  return { success: true };
}

export async function actualizarMargenPublico(formData: FormData) {
  const margen = parseFloat(formData.get("margen") as string);
  
  if (isNaN(margen) || margen < 0) {
    return { error: "Margen inválido." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuario no autenticado." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ margen_publico_defecto: margen })
    .eq("id", user.id);

  if (error) {
    return { error: "Error al actualizar margen público." };
  }

  revalidatePath("/catalogo");
  revalidatePath("/c/catalogo");

  return { success: true };
}

export async function actualizarMargenModelo(modelo: string, margen: number | null) {
  if (!modelo) return { error: "Modelo no válido." };
  
  if (margen !== null && (isNaN(margen) || margen < 0)) {
    return { error: "Margen inválido." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuario no autenticado." };
  }

  // Upsert into productos_catalogo
  const { error: dbError } = await supabase
    .from("productos_catalogo")
    .upsert({
      user_id: user.id,
      modelo: modelo,
      margen_publico: margen,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id, modelo'
    });

  if (dbError) {
    console.error("Error saving margin to DB:", dbError);
    return { error: "Error al guardar el margen del producto." };
  }

  revalidatePath("/catalogo");
  revalidatePath("/c/catalogo");

  return { success: true };
}
