import type { Categoria } from '@/domain/productos/Categoria';
import type { Ean } from '@/domain/productos/Ean';

/** Lo que una base de datos externa sabe de un código de barras. Todo es orientativo. */
export interface FichaExterna {
  marca?: string;
  nombre?: string;
  categoria?: Categoria;
  paoMeses?: number;
  imagenUrl?: string;
  /** Nombre legible de la base de datos de la que sale ("Open Beauty Facts"...). */
  fuente: string;
}

/** Puerto hacia las bases de datos de productos de internet. */
export interface CatalogoExterno {
  /** `undefined` si no lo conoce. Lanza si no se ha podido consultar (sin conexión...). */
  buscar(ean: Ean): Promise<FichaExterna | undefined>;
}

/** Un tono de un producto, con su color ('#RRGGBB'). */
export interface TonoSugerido {
  nombre?: string;
  color: string;
}

/** Un producto encontrado al buscar por nombre. */
export interface ResultadoBusquedaNombre extends FichaExterna {
  /** Código de barras (EAN-13/EAN-8), si la base de datos lo tiene. */
  ean?: string;
  /** Tonos disponibles con su color (Makeup API), para elegir uno al darlo de alta. */
  tonos?: TonoSugerido[];
}

/** Puerto hacia un catálogo de tonos: los de un producto ya identificado (escaneado). */
export interface BuscadorDeTonos {
  /** `undefined` si no lo encuentra sin dudas. Lanza si no se ha podido consultar. */
  buscarTonos(marca: string, nombre: string): Promise<TonoSugerido[] | undefined>;
}

/** Puerto hacia los buscadores por nombre ("lash sensational", "fairy limón"). */
export interface BuscadorPorNombre {
  /** Lanza si no se ha podido consultar. */
  buscarPorNombre(texto: string): Promise<ResultadoBusquedaNombre[]>;
}
