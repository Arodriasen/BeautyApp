import type { FuenteIngredientes } from '@/application/ingredientes/puertos';
import type { Ean } from '@/domain/productos/Ean';
import { parsearListaInci } from '@/domain/productos/Ingredientes';

import { getJson } from './http';

interface Respuesta {
  status: 0 | 1;
  product?: { ingredients_text?: string; ingredients_text_en?: string; ingredients_text_es?: string };
}

/** Lista de ingredientes desde Open Beauty Facts (gratis, sin clave). */
export class ObfIngredientes implements FuenteIngredientes {
  constructor(private readonly base = 'https://world.openbeautyfacts.org') {}

  async ingredientes(ean: Ean): Promise<string[] | undefined> {
    const r = await getJson<Respuesta>(
      `${this.base}/api/v2/product/${ean.valor}.json?fields=ingredients_text,ingredients_text_en,ingredients_text_es`,
    );
    const p = r?.status === 1 ? r.product : undefined;
    // Las listas INCI son iguales en todos los idiomas, pero a veces solo está rellena una.
    const texto = p?.ingredients_text?.trim() || p?.ingredients_text_en?.trim() || p?.ingredients_text_es?.trim();
    if (!texto) return undefined;
    const lista = parsearListaInci(texto);
    return lista.length ? lista : undefined;
  }
}
