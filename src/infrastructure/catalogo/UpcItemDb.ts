import type {
  BuscadorPorNombre,
  CatalogoExterno,
  FichaExterna,
  ResultadoBusquedaNombre,
} from '@/application/CatalogoExterno';
import { Ean } from '@/domain/productos/Ean';
import { coincidePorPalabras } from '@/utils/texto';

import { getJson, quitarMarca, soloHttps } from './http';
import { categoriaDesde } from './mapeo-categorias';
import { nombreDeMarca } from './marcas';

interface ItemUpc {
  ean?: string;
  title?: string;
  brand?: string;
  category?: string;
  images?: string[];
}

interface RespuestaUpc {
  code: string;
  items?: ItemUpc[];
}

function fichaDesdeUpc(item: ItemUpc): FichaExterna | undefined {
  if (!item.title) return undefined;
  const marca = item.brand?.trim() ? nombreDeMarca(item.brand) : undefined;
  return {
    marca,
    nombre: quitarMarca(item.title, marca),
    // El título va primero para que se mire el último: manda la ruta de categorías.
    categoria: categoriaDesde([item.title, ...(item.category?.split('>') ?? [])]),
    imagenUrl: item.images?.map(soloHttps).find(Boolean),
    fuente: 'UPCitemdb',
  };
}

/**
 * UPCitemdb (https://www.upcitemdb.com): catálogo general de tiendas, fuerte en marcas
 * internacionales. Plan gratuito sin clave: 100 consultas al día por IP (compartidas entre
 * códigos de barras y búsquedas por nombre).
 */
export class UpcItemDb implements CatalogoExterno, BuscadorPorNombre {
  async buscar(ean: Ean): Promise<FichaExterna | undefined> {
    const r = await getJson<RespuestaUpc>(`https://api.upcitemdb.com/prod/trial/lookup?upc=${ean.valor}`);
    const item = r?.items?.[0];
    return item ? fichaDesdeUpc(item) : undefined;
  }

  async buscarPorNombre(texto: string): Promise<ResultadoBusquedaNombre[]> {
    const q = encodeURIComponent(texto.trim());
    const r = await getJson<RespuestaUpc>(`https://api.upcitemdb.com/prod/trial/search?s=${q}&match_mode=0&type=product`);
    // Su buscador es muy laxo (devuelve felpudos al buscar «fairy limon»): solo los que
    // contienen todas las palabras buscadas.
    return (r?.items ?? []).flatMap((item) => {
      if (!coincidePorPalabras(`${item.brand ?? ''} ${item.title ?? ''}`, texto)) return [];
      const ficha = fichaDesdeUpc(item);
      if (!ficha) return [];
      return [{ ...ficha, ean: item.ean ? Ean.intentar(item.ean)?.valor : undefined }];
    });
  }
}
