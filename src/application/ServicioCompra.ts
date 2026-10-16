import { ArticuloCompra } from '@/domain/compra/ArticuloCompra';
import type { ArticuloCompraRepositorio } from '@/domain/compra/ArticuloCompraRepositorio';
import type { Producto } from '@/domain/productos/Producto';

import type { EstadoProducto, ServicioNeceser } from './ServicioNeceser';

export interface ArticuloConProducto {
  articulo: ArticuloCompra;
  /** El producto enlazado, si sigue existiendo. */
  producto?: Producto;
}

export type MotivoSugerencia = 'terminado' | 'caducado' | 'caducaPronto';

export interface Sugerencia {
  producto: Producto;
  motivo: MotivoSugerencia;
}

export interface ListaCompra {
  pendientes: ArticuloConProducto[];
  comprados: ArticuloConProducto[];
  /** Productos que probablemente haya que reponer y que aún no están en la lista. */
  sugerencias: Sugerencia[];
}

const MOTIVOS: Partial<Record<EstadoProducto['tipo'], MotivoSugerencia>> = {
  terminado: 'terminado',
  caducado: 'caducado',
  caducaPronto: 'caducaPronto',
};

const descripcionDe = (p: Producto) => [p.marca, p.nombre, p.tono].filter(Boolean).join(' · ');

export class ServicioCompra {
  constructor(
    private readonly articulos: ArticuloCompraRepositorio,
    private readonly neceser: ServicioNeceser,
    private readonly generarId: () => string,
  ) {}

  /** Añade un producto del neceser. Si ya está pendiente en la lista, no lo duplica. */
  async anadirProducto(producto: Producto, ahora = new Date()): Promise<void> {
    const todos = await this.articulos.listar();
    if (todos.some((a) => a.productoId === producto.id && !a.comprado)) return;
    await this.articulos.guardar(
      new ArticuloCompra({
        id: this.generarId(),
        descripcion: descripcionDe(producto),
        productoId: producto.id,
        creadoEl: ahora,
      }),
    );
  }

  async anadirTexto(texto: string, ahora = new Date()): Promise<void> {
    await this.articulos.guardar(new ArticuloCompra({ id: this.generarId(), descripcion: texto, creadoEl: ahora }));
  }

  async marcarComprado(id: string, comprado: boolean, ahora = new Date()): Promise<void> {
    const articulo = await this.articulos.obtener(id);
    if (!articulo) return;
    if (comprado) articulo.marcarComprado(ahora);
    else articulo.desmarcar();
    await this.articulos.guardar(articulo);
  }

  eliminar(id: string): Promise<void> {
    return this.articulos.eliminar(id);
  }

  vaciarComprados(): Promise<void> {
    return this.articulos.eliminarComprados();
  }

  /** ¿Está este producto pendiente de comprar? */
  async enLista(productoId: string): Promise<boolean> {
    return (await this.articulos.listar()).some((a) => a.productoId === productoId && !a.comprado);
  }

  async lista(hoy: Date): Promise<ListaCompra> {
    const [articulos, resumen] = await Promise.all([this.articulos.listar(), this.neceser.resumen(hoy)]);
    const productos = new Map(resumen.map((r) => [r.producto.id, r.producto]));
    const conProducto = (articulo: ArticuloCompra): ArticuloConProducto => ({
      articulo,
      producto: articulo.productoId ? productos.get(articulo.productoId) : undefined,
    });

    const pendientes = articulos
      .filter((a) => !a.comprado)
      .sort((a, b) => a.creadoEl.getTime() - b.creadoEl.getTime())
      .map(conProducto);
    const comprados = articulos
      .filter((a) => a.comprado)
      .sort((a, b) => b.compradoEl!.getTime() - a.compradoEl!.getTime())
      .map(conProducto);

    const yaEnLista = new Set(pendientes.map((p) => p.articulo.productoId).filter(Boolean));
    // El resumen ya viene ordenado por urgencia: caducados, caducan pronto, terminados…
    const sugerencias = resumen.flatMap((r): Sugerencia[] => {
      const motivo = MOTIVOS[r.estado.tipo];
      return motivo && !yaEnLista.has(r.producto.id) ? [{ producto: r.producto, motivo }] : [];
    });

    return { pendientes, comprados, sugerencias };
  }
}
