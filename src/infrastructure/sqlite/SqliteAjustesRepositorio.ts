import type { SQLiteDatabase } from 'expo-sqlite';

import { AJUSTES_POR_DEFECTO, type AjustesAvisos } from '@/application/avisos/PlanificadorAvisos';
import type { AjustesRepositorio } from '@/application/avisos/puertos';

const CLAVE_AVISOS = 'avisos';

/** Ajustes como JSON en una tabla clave/valor; lo que falte se completa con los valores por defecto. */
export class SqliteAjustesRepositorio implements AjustesRepositorio {
  constructor(private readonly db: SQLiteDatabase) {}

  async obtenerAvisos(): Promise<AjustesAvisos> {
    const fila = await this.db.getFirstAsync<{ valor: string }>('SELECT valor FROM ajustes WHERE clave = ?', CLAVE_AVISOS);
    if (!fila) return AJUSTES_POR_DEFECTO;
    try {
      return { ...AJUSTES_POR_DEFECTO, ...JSON.parse(fila.valor) };
    } catch {
      return AJUSTES_POR_DEFECTO;
    }
  }

  async guardarAvisos(ajustes: AjustesAvisos): Promise<void> {
    await this.db.runAsync(
      'INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor',
      CLAVE_AVISOS,
      JSON.stringify(ajustes),
    );
  }
}
