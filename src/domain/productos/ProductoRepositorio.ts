import type { Ean } from './Ean';
import type { Producto } from './Producto';

export interface ProductoRepositorio {
  guardar(producto: Producto): Promise<void>;
  obtener(id: string): Promise<Producto | undefined>;
  buscarPorEan(ean: Ean): Promise<Producto | undefined>;
  listar(): Promise<Producto[]>;
  eliminar(id: string): Promise<void>;
}
