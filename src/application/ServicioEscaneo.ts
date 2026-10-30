import { Ean } from '@/domain/productos/Ean';
import type { ProductoRepositorio } from '@/domain/productos/ProductoRepositorio';

import type {
  BuscadorDeTonos,
  BuscadorPorNombre,
  CatalogoExterno,
  FichaExterna,
  ResultadoBusquedaNombre,
  TonoSugerido,
} from './CatalogoExterno';

export type ResultadoEscaneo =
  | { tipo: 'invalido' }
  | { tipo: 'existente'; productoId: string }
  | { tipo: 'nuevo'; ean: Ean; ficha?: FichaExterna; sinConexion: boolean };

export interface ResultadoConNeceser extends ResultadoBusquedaNombre {
  /** Si ya está en su neceser (mismo código de barras), su id. */
  productoId?: string;
}

export class ServicioEscaneo {
  constructor(
    private readonly productos: ProductoRepositorio,
    private readonly catalogo: CatalogoExterno,
    private readonly buscador?: BuscadorPorNombre,
    private readonly tonos?: BuscadorDeTonos,
  ) {}

  /** Tonos con color de un producto escaneado. Son un extra: si no hay o falla, `undefined`. */
  async buscarTonos(marca?: string, nombre?: string): Promise<TonoSugerido[] | undefined> {
    if (!this.tonos || !marca?.trim() || !nombre?.trim()) return undefined;
    try {
      return await this.tonos.buscarTonos(marca, nombre);
    } catch {
      return undefined;
    }
  }

  /** Busca por nombre en internet y marca los que ya tiene. */
  async buscarPorNombre(texto: string): Promise<ResultadoConNeceser[]> {
    if (!this.buscador) return [];
    const resultados = await this.buscador.buscarPorNombre(texto);
    return Promise.all(
      resultados.map(async (r) => {
        const ean = r.ean ? Ean.intentar(r.ean) : undefined;
        const existente = ean ? await this.productos.buscarPorEan(ean) : undefined;
        return existente ? { ...r, productoId: existente.id } : r;
      }),
    );
  }

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
