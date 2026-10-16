import type { ArticuloCompra } from './ArticuloCompra';

export interface ArticuloCompraRepositorio {
  guardar(articulo: ArticuloCompra): Promise<void>;
  obtener(id: string): Promise<ArticuloCompra | undefined>;
  listar(): Promise<ArticuloCompra[]>;
  eliminar(id: string): Promise<void>;
  eliminarComprados(): Promise<void>;
}
