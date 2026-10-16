import type { AlmacenFotos } from '@/application/AlmacenFotos';
import { AJUSTES_POR_DEFECTO, type AjustesAvisos, type AvisoPlanificado } from '@/application/avisos/PlanificadorAvisos';
import type { AjustesRepositorio, EstadoPermiso, Notificador } from '@/application/avisos/puertos';
import type { ArticuloCompra } from '@/domain/compra/ArticuloCompra';
import type { ArticuloCompraRepositorio } from '@/domain/compra/ArticuloCompraRepositorio';
import type { Unidad } from '@/domain/inventario/Unidad';
import type { UnidadRepositorio } from '@/domain/inventario/UnidadRepositorio';
import type { Ean } from '@/domain/productos/Ean';
import type { Producto } from '@/domain/productos/Producto';
import type { ProductoRepositorio } from '@/domain/productos/ProductoRepositorio';

export class ProductosEnMemoria implements ProductoRepositorio {
  readonly datos = new Map<string, Producto>();
  async guardar(p: Producto) {
    this.datos.set(p.id, p);
  }
  async obtener(id: string) {
    return this.datos.get(id);
  }
  async buscarPorEan(ean: Ean) {
    return [...this.datos.values()].find((p) => p.ean?.equals(ean));
  }
  async listar() {
    return [...this.datos.values()];
  }
  async eliminar(id: string) {
    this.datos.delete(id);
  }
}

export class UnidadesEnMemoria implements UnidadRepositorio {
  readonly datos = new Map<string, Unidad>();
  async guardar(u: Unidad) {
    this.datos.set(u.id, u);
  }
  async obtener(id: string) {
    return this.datos.get(id);
  }
  async listar() {
    return [...this.datos.values()];
  }
  async listarPorProducto(productoId: string) {
    return [...this.datos.values()].filter((u) => u.productoId === productoId);
  }
  async eliminar(id: string) {
    this.datos.delete(id);
  }
  async eliminarPorProducto(productoId: string) {
    for (const u of await this.listarPorProducto(productoId)) this.datos.delete(u.id);
  }
}

export const fecha = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export class FotosEnMemoria implements AlmacenFotos {
  readonly guardadas = new Map<string, string>();
  private n = 0;
  async guardar(origen: string) {
    if (origen.includes('falla')) throw new Error('No se pudo descargar');
    const ref = `foto${++this.n}.jpg`;
    this.guardadas.set(ref, origen);
    return ref;
  }
  async eliminar(referencia: string) {
    this.guardadas.delete(referencia);
  }
}

export class AjustesEnMemoria implements AjustesRepositorio {
  constructor(public avisos: AjustesAvisos = AJUSTES_POR_DEFECTO) {}
  async obtenerAvisos() {
    return this.avisos;
  }
  async guardarAvisos(a: AjustesAvisos) {
    this.avisos = a;
  }
}

export class NotificadorFalso implements Notificador {
  programados: AvisoPlanificado[] = [];
  pruebas = 0;
  constructor(
    public estado: EstadoPermiso = 'concedido',
    private readonly concedeAlPedir = true,
  ) {}
  async permiso() {
    return this.estado;
  }
  async pedirPermiso() {
    this.estado = this.concedeAlPedir ? 'concedido' : 'denegado';
    return this.concedeAlPedir;
  }
  async programar(avisos: AvisoPlanificado[]) {
    this.programados = avisos;
  }
  async probar() {
    this.pruebas++;
  }
}

export class CompraEnMemoria implements ArticuloCompraRepositorio {
  readonly datos = new Map<string, ArticuloCompra>();
  async guardar(a: ArticuloCompra) {
    this.datos.set(a.id, a);
  }
  async obtener(id: string) {
    return this.datos.get(id);
  }
  async listar() {
    return [...this.datos.values()];
  }
  async eliminar(id: string) {
    this.datos.delete(id);
  }
  async eliminarComprados() {
    for (const a of this.datos.values()) if (a.comprado) this.datos.delete(a.id);
  }
}
