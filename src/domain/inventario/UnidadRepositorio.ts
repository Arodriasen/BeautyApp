import type { Unidad } from './Unidad';

export interface UnidadRepositorio {
  guardar(unidad: Unidad): Promise<void>;
  obtener(id: string): Promise<Unidad | undefined>;
  listar(): Promise<Unidad[]>;
  listarPorProducto(productoId: string): Promise<Unidad[]>;
  eliminar(id: string): Promise<void>;
  eliminarPorProducto(productoId: string): Promise<void>;
}
