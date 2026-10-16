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
