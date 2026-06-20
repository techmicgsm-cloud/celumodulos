"use server";

import { GoogleGenAI, Type, Schema } from "@google/genai";

export async function extraerDatosFactura(formData: FormData) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { error: "No se ha configurado GEMINI_API_KEY en el servidor." };
    }

    const ai = new GoogleGenAI({ apiKey });

    const file = formData.get("file") as File | null;
    if (!file) {
      return { error: "No se proporcionó ningún archivo." };
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "application/pdf";

    const responseSchema: Schema = {
      type: Type.ARRAY,
      description: "Lista de modelos encontrados en la factura",
      items: {
        type: Type.OBJECT,
        properties: {
          marca: {
            type: Type.STRING,
            description: "Marca del producto (ej. Samsung, Apple, Motorola), dejar vacío si no se encuentra",
          },
          categoria: {
            type: Type.STRING,
            description: "Categoría del producto (ej. Módulo, Batería, Pin de carga), dejar vacío si no se encuentra",
          },
          modelo: {
            type: Type.STRING,
            description: "Nombre del modelo específico (ej. A14 4G, iPhone 11 Pro). Obligatorio.",
          },
          sku: {
            type: Type.STRING,
            description: "Código SKU del producto si figura en la factura, dejar vacío si no",
          },
          cantidad: {
            type: Type.INTEGER,
            description: "Cantidad de unidades compradas de este modelo. Obligatorio.",
          },
          precioUsdUnitario: {
            type: Type.NUMBER,
            description: "Precio unitario en dólares de este modelo. Si está en otra moneda, conviértelo si hay un tipo de cambio explícito, de lo contrario devuelve el precio numérico. Obligatorio.",
          },
        },
        required: ["modelo", "cantidad", "precioUsdUnitario"],
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType,
              },
            },
            {
              text: `Eres un asistente experto en contabilidad e inventario de accesorios y repuestos de telefonía celular.
Tu tarea es leer esta factura de compra y extraer todos los productos/ítems comprados.
Devuelve los datos estrictamente estructurados según el esquema JSON indicado.
Intenta inferir la marca y categoría (Módulo, Pantalla, Batería, etc.) a partir de la descripción del producto si no están explícitas.
Ignora servicios como flete o seguros, concéntrate solo en la mercadería (repuestos).
Si el archivo es ilegible o no contiene productos, devuelve un array vacío [].`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      return { error: "La IA no devolvió ningún texto." };
    }

    try {
      const items = JSON.parse(jsonText);
      return { data: items };
    } catch (parseError) {
      return { error: "La IA devolvió un formato inválido que no pudo ser procesado." };
    }

  } catch (err: any) {
    console.error("Error extrañendo datos con Gemini:", err);
    return { error: err.message || "Ocurrió un error inesperado al procesar la factura." };
  }
}
