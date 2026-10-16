import type { CatalogoExterno, FichaExterna } from '@/application/CatalogoExterno';
import type { Ean } from '@/domain/productos/Ean';

import { getJson, quitarMarca, soloHttps } from './http';
import { categoriaDesde } from './mapeo-categorias';

interface RespuestaObf {
  status: 0 | 1;
  product?: {
    product_name?: string;
    product_name_es?: string;
    product_name_en?: string;
    brands?: string;
    categories_tags?: string[];
    periods_after_opening_tags?: string[];
    image_front_small_url?: string;
  };
}

const CAMPOS = [
  'product_name',
  'product_name_es',
  'product_name_en',
  'brands',
  'categories_tags',
  'periods_after_opening_tags',
  'image_front_small_url',
].join(',');

/**
 * Open Beauty Facts (https://world.openbeautyfacts.org): base de datos abierta de cosmética,
 * sin clave. Límite: 15 consultas de producto por minuto.
 */
export class OpenBeautyFacts implements CatalogoExterno {
  constructor(private readonly base = 'https://world.openbeautyfacts.org') {}

  async buscar(ean: Ean): Promise<FichaExterna | undefined> {
    const r = await getJson<RespuestaObf>(`${this.base}/api/v2/product/${ean.valor}.json?fields=${CAMPOS}`);
    const p = r?.status === 1 ? r.product : undefined;
    if (!p) return undefined;

    const marca = p.brands?.split(',')[0]?.trim() || undefined;
    // Preferimos español, luego inglés (`product_name` va en el idioma principal del envase).
    // El inglés solo si es un nombre de verdad: a veces es un simple "lipstick".
    const en = p.product_name_en?.trim();
    const nombre = p.product_name_es?.trim() || (en?.includes(' ') ? en : undefined) || p.product_name?.trim();
    const pao = p.periods_after_opening_tags?.map((t) => /(\d+)-months?/.exec(t)?.[1]).find(Boolean);

    return {
      marca,
      nombre: nombre ? quitarMarca(nombre, marca) : undefined,
      // El nombre va primero para que se mire el último: mandan las etiquetas.
      categoria: categoriaDesde([nombre ?? '', ...(p.categories_tags ?? [])]),
      paoMeses: pao ? Number(pao) : undefined,
      imagenUrl: soloHttps(p.image_front_small_url),
      fuente: 'Open Beauty Facts',
    };
  }
}
