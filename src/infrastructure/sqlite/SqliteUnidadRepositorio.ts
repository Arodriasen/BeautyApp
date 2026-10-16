import type { SQLiteDatabase } from 'expo-sqlite';

import { Unidad } from '@/domain/inventario/Unidad';
import type { UnidadRepositorio } from '@/domain/inventario/UnidadRepositorio';

import { aSql, deSql } from './fechas-sql';

interface FilaUnidad {
  id: string;
  producto_id: string;
  fecha_compra: string | null;
  fecha_apertura: string | null;
  caducidad_fabricante: string | null;
  fecha_terminado: string | null;
}

function aUnidad(f: FilaUnidad): Unidad {
  return new Unidad({
    id: f.id,
    productoId: f.producto_id,
    fechaCompra: deSql(f.fecha_compra),
    fechaApertura: deSql(f.fecha_apertura),
    caducidadFabricante: deSql(f.caducidad_fabricante),
    fechaTerminado: deSql(f.fecha_terminado),
  });
}

export class SqliteUnidadRepositorio implements UnidadRepositorio {
  constructor(private readonly db: SQLiteDatabase) {}

  async guardar(u: Unidad): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO unidades (id, producto_id, fecha_compra, fecha_apertura, caducidad_fabricante, fecha_terminado)
       VALUES ($id, $producto, $compra, $apertura, $caducidad, $terminado)
       ON CONFLICT (id) DO UPDATE SET
         fecha_compra = excluded.fecha_compra, fecha_apertura = excluded.fecha_apertura,
         caducidad_fabricante = excluded.caducidad_fabricante, fecha_terminado = excluded.fecha_terminado`,
      {
        $id: u.id,
        $producto: u.productoId,
        $compra: aSql(u.fechaCompra),
        $apertura: aSql(u.fechaApertura),
        $caducidad: aSql(u.caducidadFabricante),
        $terminado: aSql(u.fechaTerminado),
      },
    );
  }

  async obtener(id: string): Promise<Unidad | undefined> {
    const fila = await this.db.getFirstAsync<FilaUnidad>('SELECT * FROM unidades WHERE id = ?', id);
    return fila ? aUnidad(fila) : undefined;
  }

  async listar(): Promise<Unidad[]> {
    const filas = await this.db.getAllAsync<FilaUnidad>('SELECT * FROM unidades');
    return filas.map(aUnidad);
  }

  async listarPorProducto(productoId: string): Promise<Unidad[]> {
    const filas = await this.db.getAllAsync<FilaUnidad>(
      'SELECT * FROM unidades WHERE producto_id = ?',
      productoId,
    );
    return filas.map(aUnidad);
  }

  async eliminar(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM unidades WHERE id = ?', id);
  }

  async eliminarPorProducto(productoId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM unidades WHERE producto_id = ?', productoId);
  }
}
