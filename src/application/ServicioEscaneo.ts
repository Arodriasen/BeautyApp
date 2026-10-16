import { Ean } from '@/domain/productos/Ean';
import type { ProductoRepositorio } from '@/domain/productos/ProductoRepositorio';

import type { CatalogoExterno, FichaExterna } from './CatalogoExterno';

export type ResultadoEscaneo =
  | { tipo: 'invalido' }
  | { tipo: 'existente'; productoId: string }
  | { tipo: 'nuevo'; ean: Ean; ficha?: FichaExterna; sinConexion: boolean };

export class ServicioEscaneo {
  constructor(
    private readonly productos: ProductoRepositorio,
    private readonly catalogo: CatalogoExterno,
  ) {}

  /** Primero mira el neceser; si no lo tiene, pregunta a internet. */
  async identificar(codigo: string): Promise<ResultadoEscaneo> {
    const ean = Ean.intentar(codigo);
    if (!ean) return { tipo: 'invalido' };

    const existente = await this.productos.buscarPorEan(ean);
    if (existente) return { tipo: 'existente', productoId: existente.id };

    try {
      const ficha = await this.catalogo.buscar(ean);
      return { tipo: 'nuevo', ean, ficha, sinConexion: false };
    } catch {
      return { tipo: 'nuevo', ean, sinConexion: true };
    }
  }
}
