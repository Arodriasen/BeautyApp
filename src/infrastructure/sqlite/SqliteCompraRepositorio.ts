import type { SQLiteDatabase } from 'expo-sqlite';

import { ArticuloCompra } from '@/domain/compra/ArticuloCompra';
import type { ArticuloCompraRepositorio } from '@/domain/compra/ArticuloCompraRepositorio';

import { aSql, deSql } from './fechas-sql';

interface FilaCompra {
  id: string;
  descripcion: string;
  producto_id: string | null;
  nota: string | null;
  /** Fecha y hora ISO completa: sirve para mantener el orden en que se añadieron. */
  creado_el: string;
  comprado_el: string | null;
}

function aArticulo(f: FilaCompra): ArticuloCompra {
  return new ArticuloCompra({
    id: f.id,
    descripcion: f.descripcion,
    productoId: f.producto_id ?? undefined,
    nota: f.nota ?? undefined,
    creadoEl: new Date(f.creado_el),
    compradoEl: deSql(f.comprado_el),
  });
}

export class SqliteCompraRepositorio implements ArticuloCompraRepositorio {
  constructor(private readonly db: SQLiteDatabase) {}

  async guardar(a: ArticuloCompra): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO compra (id, descripcion, producto_id, nota, creado_el, comprado_el)
       VALUES ($id, $descripcion, $producto, $nota, $creado, $comprado)
       ON CONFLICT (id) DO UPDATE SET
         descripcion = excluded.descripcion, producto_id = excluded.producto_id,
         nota = excluded.nota, comprado_el = excluded.comprado_el`,
      {
        $id: a.id,
        $descripcion: a.descripcion,
        $producto: a.productoId ?? null,
        $nota: a.nota ?? null,
        $creado: a.creadoEl.toISOString(),
        $comprado: aSql(a.compradoEl),
      },
    );
  }

  async obtener(id: string): Promise<ArticuloCompra | undefined> {
    const fila = await this.db.getFirstAsync<FilaCompra>('SELECT * FROM compra WHERE id = ?', id);
    return fila ? aArticulo(fila) : undefined;
  }

  async listar(): Promise<ArticuloCompra[]> {
    return (await this.db.getAllAsync<FilaCompra>('SELECT * FROM compra')).map(aArticulo);
  }

  async eliminar(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM compra WHERE id = ?', id);
  }

  async eliminarComprados(): Promise<void> {
    await this.db.runAsync('DELETE FROM compra WHERE comprado_el IS NOT NULL');
  }
}
