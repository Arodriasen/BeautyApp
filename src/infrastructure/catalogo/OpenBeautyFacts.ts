import type {
  BuscadorPorNombre,
  CatalogoExterno,
  FichaExterna,
  ResultadoBusquedaNombre,
} from '@/application/CatalogoExterno';
import { Ean } from '@/domain/productos/Ean';

import { getJson, quitarMarca, soloHttps } from './http';
import { categoriaDesde } from './mapeo-categorias';
import { nombreDeMarca } from './marcas';

/** Formato de producto de Open Beauty Facts (el mismo que el resto de la familia Open Facts). */
export interface ProductoOpenFacts {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  product_name_en?: string;
  brands?: string;
  categories_tags?: string[];
  periods_after_opening_tags?: string[];
  image_front_small_url?: string;
}

interface RespuestaProducto {
  status: 0 | 1;
  product?: ProductoOpenFacts;
}

interface RespuestaBusqueda {
  products?: ProductoOpenFacts[];
}

const CAMPOS = [
  'code',
  'product_name',
  'product_name_es',
  'product_name_en',
  'brands',
  'categories_tags',
  'periods_after_opening_tags',
  'image_front_small_url',
].join(',');

/** Traduce un producto de Open Facts a nuestra ficha. `undefined` si no tiene nombre. */
export function fichaDesdeOpenFacts(p: ProductoOpenFacts, fuente: string): FichaExterna | undefined {
  const original = p.brands?.split(',')[0]?.trim();
  const marca = original ? nombreDeMarca(original) : undefined;
  // Preferimos español, luego inglés (`product_name` va en el idioma principal del envase).
  // El inglés solo si es un nombre de verdad: a veces es un simple "lipstick".
  const en = p.product_name_en?.trim();
  const nombre = p.product_name_es?.trim() || (en?.includes(' ') ? en : undefined) || p.product_name?.trim();
  if (!nombre) return undefined;
  const pao = p.periods_after_opening_tags?.map((t) => /(\d+)-months?/.exec(t)?.[1]).find(Boolean);

  return {
    marca,
    nombre: quitarMarca(nombre, marca),
    // El nombre va primero para que se mire el último: mandan las etiquetas.
    categoria: categoriaDesde([nombre, ...(p.categories_tags ?? [])]),
    paoMeses: pao ? Number(pao) : undefined,
    imagenUrl: soloHttps(p.image_front_small_url),
    fuente,
  };
}

/**
 * Open Beauty Facts (https://world.openbeautyfacts.org): base de datos abierta de cosmética,
 * sin clave. Límites: 15 consultas de producto y 10 búsquedas por minuto.
 */
export class OpenBeautyFacts implements CatalogoExterno, BuscadorPorNombre {
  constructor(
    private readonly base = 'https://world.openbeautyfacts.org',
    private readonly fuente = 'Open Beauty Facts',
  ) {}

  async buscar(ean: Ean): Promise<FichaExterna | undefined> {
    const r = await getJson<RespuestaProducto>(`${this.base}/api/v2/product/${ean.valor}.json?fields=${CAMPOS}`);
    const p = r?.status === 1 ? r.product : undefined;
    return p ? fichaDesdeOpenFacts(p, this.fuente) : undefined;
  }

  async buscarPorNombre(texto: string, limite = 20): Promise<ResultadoBusquedaNombre[]> {
    const q = encodeURIComponent(texto.trim());
    const r = await getJson<RespuestaBusqueda>(
      `${this.base}/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=${limite}&fields=${CAMPOS}`,
    );
    return (r?.products ?? []).flatMap((p) => {
      const ficha = fichaDesdeOpenFacts(p, this.fuente);
      if (!ficha) return [];
      return [{ ...ficha, ean: p.code ? Ean.intentar(p.code)?.valor : undefined }];
    });
  }
}

