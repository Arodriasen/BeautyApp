import { parsearListaInci } from '@/domain/productos/Ingredientes';
import type { Producto } from '@/domain/productos/Producto';
import type { ProductoRepositorio } from '@/domain/productos/ProductoRepositorio';

import type {
  AjustesIngredientes,
  AjustesIngredientesRepositorio,
  AnalizadorIngredientes,
  FuenteIngredientes,
} from './puertos';

export type ResultadoBusqueda = 'encontrados' | 'noEncontrados' | 'sinCodigo';

export class ServicioIngredientes {
  constructor(
    private readonly productos: ProductoRepositorio,
    private readonly ajustes: AjustesIngredientesRepositorio,
    private readonly fuente: FuenteIngredientes,
    private readonly analizador: AnalizadorIngredientes,
  ) {}

  obtenerAjustes(): Promise<AjustesIngredientes> {
    return this.ajustes.obtenerIngredientes();
  }

  async guardarAjustes(ajustes: AjustesIngredientes): Promise<void> {
    const vistos = new Set<string>();
    const evitar = ajustes.evitar
      .map((t) => t.trim())
      .filter((t) => t && !vistos.has(t.toLowerCase()) && vistos.add(t.toLowerCase()));
    await this.ajustes.guardarIngredientes({ evitar, claveInci: ajustes.claveInci?.trim() || undefined });
  }

  /** Guarda la lista escrita o pegada por ella. Un texto vacío borra la lista. */
  async guardarLista(productoId: string, texto: string): Promise<void> {
    const producto = await this.obtener(productoId);
    const lista = parsearListaInci(texto);
    await this.productos.guardar(producto.conIngredientes(lista.length ? lista : undefined));
  }

  /**
   * Busca la lista por el código de barras: primero en Open Beauty Facts (gratis) y, si no
   * la tiene y hay clave, en INCI API (que de paso la analiza).
   */
  async buscarLista(productoId: string): Promise<ResultadoBusqueda> {
    const producto = await this.obtener(productoId);
    if (!producto.ean) return 'sinCodigo';

    const lista = await this.fuente.ingredientes(producto.ean).catch(() => undefined);
    if (lista?.length) {
      await this.productos.guardar(producto.conIngredientes(lista));
      return 'encontrados';
    }

    const { claveInci } = await this.ajustes.obtenerIngredientes();
    if (claveInci) {
      const r = await this.analizador.porCodigo(producto.ean, claveInci);
      if (r?.ingredientes.length) {
        await this.productos.guardar(producto.conIngredientes(r.ingredientes).conAnalisis(r.analisis));
        return 'encontrados';
      }
    }
    return 'noEncontrados';
  }

  /** Analiza la lista guardada con INCI API y guarda el resultado (para no gastar consultas). */
  async analizar(productoId: string): Promise<void> {
    const { claveInci } = await this.ajustes.obtenerIngredientes();
    if (!claveInci) throw new Error('Para analizar hace falta la clave de INCI API (Ajustes → Ingredientes).');
    const producto = await this.obtener(productoId);
    if (!producto.ingredientes?.length) throw new Error('Primero añade la lista de ingredientes.');
    const analisis = await this.analizador.analizar(producto.ingredientes, claveInci);
    await this.productos.guardar(producto.conAnalisis(analisis));
  }

  private async obtener(id: string): Promise<Producto> {
    const p = await this.productos.obtener(id);
    if (!p) throw new Error('El producto no existe');
    return p;
  }
}
