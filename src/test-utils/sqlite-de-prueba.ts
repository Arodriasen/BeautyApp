/**
 * Base de datos SQLite real en memoria para los tests (sql.js = SQLite compilado a WebAssembly),
 * con la parte de la API de expo-sqlite que usan nuestros repositorios. Así se prueban de verdad
 * el SQL, las migraciones, las claves foráneas y las cascadas, sin el móvil.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import initSqlJs, { type BindParams, type Database } from 'sql.js';

type Parametros = unknown[];

/** expo-sqlite acepta parámetros variádicos, un array o un objeto con claves `$nombre`. */
function aBind(params: Parametros): BindParams | undefined {
  if (params.length === 0) return undefined;
  if (params.length === 1 && Array.isArray(params[0])) return params[0] as BindParams;
  if (params.length === 1 && params[0] !== null && typeof params[0] === 'object') return params[0] as BindParams;
  return params as BindParams;
}

class SqliteDePrueba {
  constructor(readonly db: Database) {}

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, ...params: Parametros) {
    this.db.run(sql, aBind(params));
    return { changes: this.db.getRowsModified(), lastInsertRowId: 0 };
  }

  async getAllAsync<T>(sql: string, ...params: Parametros): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    try {
      const b = aBind(params);
      if (b) stmt.bind(b);
      const filas: T[] = [];
      while (stmt.step()) filas.push(stmt.getAsObject() as T);
      return filas;
    } finally {
      stmt.free();
    }
  }

  async getFirstAsync<T>(sql: string, ...params: Parametros): Promise<T | null> {
    return (await this.getAllAsync<T>(sql, ...params))[0] ?? null;
  }

  async withTransactionAsync(tarea: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN');
    try {
      await tarea();
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
}

let motor: Awaited<ReturnType<typeof initSqlJs>> | undefined;

/** Una base de datos vacía y nueva en cada llamada. */
export async function nuevaBaseDePrueba(): Promise<SQLiteDatabase & { db: Database }> {
  motor ??= await initSqlJs();
  return new SqliteDePrueba(new motor.Database()) as unknown as SQLiteDatabase & { db: Database };
}
