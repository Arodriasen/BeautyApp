import type { CatalogoExterno, FichaExterna } from '@/application/CatalogoExterno';
import type { Ean } from '@/domain/productos/Ean';

import { getJson, quitarMarca, soloHttps } from './http';
import { categoriaDesde } from './mapeo-categorias';

interface RespuestaUpc {
  code: string;
  items?: {
    title?: string;
    brand?: string;
    category?: string;
    images?: string[];
  }[];
}

/**
 * UPCitemdb (https://www.upcitemdb.com): catálogo general de tiendas, fuerte en marcas
 * internacionales. Plan gratuito sin clave: 100 consultas al día por IP.
 */
export class UpcItemDb implements CatalogoExterno {
  async buscar(ean: Ean): Promise<FichaExterna | undefined> {
    const r = await getJson<RespuestaUpc>(`https://api.upcitemdb.com/prod/trial/lookup?upc=${ean.valor}`);
    const item = r?.items?.[0];
    if (!item?.title) return undefined;

    const marca = item.brand?.trim() || undefined;
    return {
      marca,
      nombre: quitarMarca(item.title, marca),
      // El título va primero para que se mire el último: manda la ruta de categorías.
      categoria: categoriaDesde([item.title, ...(item.category?.split('>') ?? [])]),
      imagenUrl: item.images?.map(soloHttps).find(Boolean),
      fuente: 'UPCitemdb',
    };
  }
}
