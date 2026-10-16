import type { UnidadRepositorio } from '@/domain/inventario/UnidadRepositorio';
import type { ProductoRepositorio } from '@/domain/productos/ProductoRepositorio';

import { planificarAvisos, type AjustesAvisos, type AvisoPlanificado, type BoteEnUso } from './PlanificadorAvisos';
import type { AjustesRepositorio, EstadoPermiso, Notificador } from './puertos';

export class ServicioAvisos {
  constructor(
    private readonly productos: ProductoRepositorio,
    private readonly unidades: UnidadRepositorio,
    private readonly ajustes: AjustesRepositorio,
    private readonly notificador: Notificador,
  ) {}

  obtenerAjustes(): Promise<AjustesAvisos> {
    return this.ajustes.obtenerAvisos();
  }

  /**
   * Guarda los ajustes y reprograma. Al activar pide permiso si hace falta;
   * devuelve `false` si el usuario lo niega (los avisos quedan desactivados).
   */
  async guardarAjustes(nuevos: AjustesAvisos): Promise<boolean> {
    let concedido = true;
    if (nuevos.activados && (await this.notificador.permiso()) !== 'concedido') {
      concedido = await this.notificador.pedirPermiso();
    }
    await this.ajustes.guardarAvisos({ ...nuevos, activados: nuevos.activados && concedido });
    await this.sincronizar();
    return concedido;
  }

  /** Recalcula y reprograma todos los avisos. Se llama al abrir la app y tras cada cambio. */
  async sincronizar(ahora = new Date()): Promise<void> {
    const avisos = await this.planificar(ahora);
    if (avisos.length > 0 && (await this.notificador.permiso()) !== 'concedido') return;
    await this.notificador.programar(avisos);
  }

  /** Lo que se programaría ahora mismo (para enseñar el próximo aviso en ajustes). */
  async planificar(ahora = new Date()): Promise<AvisoPlanificado[]> {
    const [ajustes, productos, unidades] = await Promise.all([
      this.ajustes.obtenerAvisos(),
      this.productos.listar(),
      this.unidades.listar(),
    ]);
    const porId = new Map(productos.map((p) => [p.id, p]));
    const botes: BoteEnUso[] = unidades
      .filter((u) => !u.terminada && porId.has(u.productoId))
      .map((unidad) => ({ unidad, producto: porId.get(unidad.productoId)! }));
    return planificarAvisos(botes, ajustes, ahora);
  }

  /** Primera vez: si los avisos están activados y aún no se ha preguntado, pide permiso. */
  async pedirPermisoSiNoSeHaPreguntado(): Promise<void> {
    const ajustes = await this.ajustes.obtenerAvisos();
    if (ajustes.activados && (await this.notificador.permiso()) === 'preguntable') {
      await this.notificador.pedirPermiso();
    }
  }

  estadoPermiso(): Promise<EstadoPermiso> {
    return this.notificador.permiso();
  }

  probar(): Promise<void> {
    return this.notificador.probar();
  }
}
