import type { SQLiteDatabase } from 'expo-sqlite';

import { AJUSTES_POR_DEFECTO, type AjustesAvisos } from '@/application/avisos/PlanificadorAvisos';
import type { AjustesRepositorio } from '@/application/avisos/puertos';
import {
  AJUSTES_INGREDIENTES_POR_DEFECTO,
  type AjustesIngredientes,
  type AjustesIngredientesRepositorio,
} from '@/application/ingredientes/puertos';

const CLAVE_AVISOS = 'avisos';
const CLAVE_INGREDIENTES = 'ingredientes';

/** Ajustes como JSON en una tabla clave/valor; lo que falte se completa con los valores por defecto. */
export class SqliteAjustesRepositorio implements AjustesRepositorio, AjustesIngredientesRepositorio {
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

  async obtenerIngredientes(): Promise<AjustesIngredientes> {
    return { ...AJUSTES_INGREDIENTES_POR_DEFECTO, ...(await this.leer<AjustesIngredientes>(CLAVE_INGREDIENTES)) };
  }

  async guardarIngredientes(ajustes: AjustesIngredientes): Promise<void> {
    await this.escribir(CLAVE_INGREDIENTES, ajustes);
  }

  private async leer<T>(clave: string): Promise<Partial<T> | undefined> {
    const fila = await this.db.getFirstAsync<{ valor: string }>('SELECT valor FROM ajustes WHERE clave = ?', clave);
    if (!fila) return undefined;
    try {
      return JSON.parse(fila.valor) as Partial<T>;
    } catch {
      return undefined;
    }
  }

  private async escribir(clave: string, valor: unknown): Promise<void> {
    await this.db.runAsync(
      'INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor',
      clave,
      JSON.stringify(valor),
    );
  }
}
