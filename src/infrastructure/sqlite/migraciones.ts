import type { SQLiteDatabase } from 'expo-sqlite';

export const NOMBRE_BASE_DATOS = 'beautyapp.db';

/** Se ejecuta al abrir la base de datos (SQLiteProvider.onInit). */
export async function migrar(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);

  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = fila?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE productos (
        id         TEXT PRIMARY KEY NOT NULL,
        marca      TEXT NOT NULL,
        nombre     TEXT NOT NULL,
        categoria  TEXT NOT NULL,
        ean        TEXT,
        tono       TEXT,
        pao_meses  INTEGER
      );
      CREATE INDEX ix_productos_ean ON productos (ean);

      CREATE TABLE unidades (
        id                    TEXT PRIMARY KEY NOT NULL,
        producto_id           TEXT NOT NULL REFERENCES productos (id) ON DELETE CASCADE,
        fecha_compra          TEXT,
        fecha_apertura        TEXT,
        caducidad_fabricante  TEXT,
        fecha_terminado       TEXT
      );
      CREATE INDEX ix_unidades_producto ON unidades (producto_id);
    `);
    version = 1;
  }

  if (version < 2) {
    await db.execAsync(`ALTER TABLE productos ADD COLUMN foto TEXT;`);
    version = 2;
  }

  if (version < 3) {
    await db.execAsync(`CREATE TABLE ajustes (clave TEXT PRIMARY KEY NOT NULL, valor TEXT NOT NULL);`);
    version = 3;
  }

  if (version < 4) {
    await db.execAsync(`
      CREATE TABLE compra (
        id           TEXT PRIMARY KEY NOT NULL,
        descripcion  TEXT NOT NULL,
        producto_id  TEXT REFERENCES productos (id) ON DELETE SET NULL,
        nota         TEXT,
        creado_el    TEXT NOT NULL,
        comprado_el  TEXT
      );
    `);
    version = 4;
  }

  if (version < 5) {
    await db.execAsync(`ALTER TABLE productos ADD COLUMN color_tono TEXT;`);
    version = 5;
  }

  await db.execAsync(`PRAGMA user_version = ${version}`);
}
