/**
 * @jest-environment node
 */
import { ArticuloCompra } from '@/domain/compra/ArticuloCompra';
import { Unidad } from '@/domain/inventario/Unidad';
import { Ean } from '@/domain/productos/Ean';
import { Pao } from '@/domain/productos/Pao';
import { Producto } from '@/domain/productos/Producto';
import { fecha } from '@/test-utils/en-memoria';
import { nuevaBaseDePrueba } from '@/test-utils/sqlite-de-prueba';

import { migrar } from '../migraciones';
import { SqliteAjustesRepositorio } from '../SqliteAjustesRepositorio';
import { SqliteCompraRepositorio } from '../SqliteCompraRepositorio';
import { SqliteProductoRepositorio } from '../SqliteProductoRepositorio';
import { SqliteUnidadRepositorio } from '../SqliteUnidadRepositorio';

async function base() {
  const db = await nuevaBaseDePrueba();
  await migrar(db);
  return {
    db,
    productos: new SqliteProductoRepositorio(db),
    unidades: new SqliteUnidadRepositorio(db),
    compra: new SqliteCompraRepositorio(db),
    ajustes: new SqliteAjustesRepositorio(db),
  };
}

const version = async (db: Awaited<ReturnType<typeof nuevaBaseDePrueba>>) =>
  (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version;

const producto = (id = 'p1', extra: Partial<ConstructorParameters<typeof Producto>[0]> = {}) =>
  new Producto({ id, marca: 'Maybelline', nombre: 'Lash Sensational', categoria: 'mascara', ...extra });

describe('migraciones', () => {
  it('una base nueva queda en la última versión con todas las tablas', async () => {
    const { db } = await base();
    expect(await version(db)).toBe(8);
    const tablas = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`,
    );
    expect(tablas.map((t) => t.name)).toEqual(['ajustes', 'compra', 'productos', 'unidades']);
  });

  it('una base de la versión 7 pierde las tablas de looks', async () => {
    const db = await nuevaBaseDePrueba();
    await migrar(db);
    await db.execAsync(`
      CREATE TABLE looks (id TEXT PRIMARY KEY NOT NULL);
      CREATE TABLE pasos_look (look_id TEXT NOT NULL REFERENCES looks (id) ON DELETE CASCADE);
      PRAGMA user_version = 7;
    `);
    await migrar(db);
    expect(await version(db)).toBe(8);
    const tablas = await db.getAllAsync<{ name: string }>(`SELECT name FROM sqlite_master WHERE name LIKE '%look%'`);
    expect(tablas).toEqual([]);
  });

  it('migrar dos veces no rompe nada', async () => {
    const { db } = await base();
    await expect(migrar(db)).resolves.toBeUndefined();
  });

  it('una base de la versión 1 con datos se actualiza sin perderlos', async () => {
    const db = await nuevaBaseDePrueba();
    // Esquema y datos tal como los dejaba la primera versión de la app.
    await db.execAsync(`
      CREATE TABLE productos (id TEXT PRIMARY KEY NOT NULL, marca TEXT NOT NULL, nombre TEXT NOT NULL,
        categoria TEXT NOT NULL, ean TEXT, tono TEXT, pao_meses INTEGER);
      CREATE TABLE unidades (id TEXT PRIMARY KEY NOT NULL,
        producto_id TEXT NOT NULL REFERENCES productos (id) ON DELETE CASCADE,
        fecha_compra TEXT, fecha_apertura TEXT, caducidad_fabricante TEXT, fecha_terminado TEXT);
      INSERT INTO productos VALUES ('viejo', 'NYX', 'Epic Wear', 'delineador', '0800897197148', 'Black', 6);
      INSERT INTO unidades VALUES ('u1', 'viejo', NULL, '2026-09-01', NULL, NULL);
      PRAGMA user_version = 1;
    `);
    await migrar(db);

    const p = await new SqliteProductoRepositorio(db).obtener('viejo');
    expect(p).toMatchObject({ marca: 'NYX', tono: 'Black', foto: undefined, colorTono: undefined, ingredientes: undefined });
    expect(p?.pao?.meses).toBe(6);
    expect((await new SqliteUnidadRepositorio(db).obtener('u1'))?.fechaApertura).toEqual(fecha('2026-09-01'));
    expect(await version(db)).toBe(8);
  });
});

describe('SqliteProductoRepositorio', () => {
  it('guarda y recupera todos los campos', async () => {
    const { productos } = await base();
    const analisis = {
      puntuacion: 7.3,
      nivel: 'low_risk' as const,
      alergenos: ['Linalool'],
      aptoEmbarazo: true,
      fecha: new Date('2026-10-16T10:00:00Z'),
    };
    await productos.guardar(
      producto('p1', {
        ean: Ean.crear('0800897197148'),
        tono: 'Very Black',
        pao: Pao.crear(6),
        foto: 'f.jpg',
        colorTono: '#1D1A1C',
        ingredientes: ['Aqua', 'Linalool'],
        analisis,
      }),
    );
    const p = await productos.obtener('p1');
    expect(p).toMatchObject({
      tono: 'Very Black',
      foto: 'f.jpg',
      colorTono: '#1D1A1C',
      ingredientes: ['Aqua', 'Linalool'],
      analisis,
    });
    expect(p?.ean?.valor).toBe('0800897197148');
    expect((await productos.buscarPorEan(Ean.crear('0800897197148')))?.id).toBe('p1');
  });

  it('volver a guardar un producto NO borra sus botes (upsert, no INSERT OR REPLACE)', async () => {
    const { productos, unidades } = await base();
    await productos.guardar(producto());
    await unidades.guardar(new Unidad({ id: 'u1', productoId: 'p1', fechaApertura: fecha('2026-09-01') }));
    await productos.guardar(producto('p1', { nombre: 'Lash Sensational Sky High' }));
    expect(await unidades.listarPorProducto('p1')).toHaveLength(1);
    expect((await productos.obtener('p1'))?.nombre).toBe('Lash Sensational Sky High');
  });

  it('al borrar un producto se borran sus botes y la compra se desenlaza', async () => {
    const { productos, unidades, compra } = await base();
    await productos.guardar(producto());
    await unidades.guardar(new Unidad({ id: 'u1', productoId: 'p1' }));
    await compra.guardar(
      new ArticuloCompra({ id: 'c1', descripcion: 'Maybelline · Lash', productoId: 'p1', creadoEl: new Date() }),
    );

    await productos.eliminar('p1');

    expect(await unidades.listar()).toEqual([]);
    const [articulo] = await compra.listar();
    expect(articulo).toMatchObject({ descripcion: 'Maybelline · Lash', productoId: undefined });
  });
});

describe('SqliteUnidadRepositorio', () => {
  it('guarda las fechas como días de calendario', async () => {
    const { productos, unidades } = await base();
    await productos.guardar(producto());
    const u = new Unidad({
      id: 'u1',
      productoId: 'p1',
      fechaCompra: fecha('2026-08-30'),
      fechaApertura: fecha('2026-09-01'),
      caducidadFabricante: fecha('2027-12-31'),
    });
    u.terminar(fecha('2026-10-16'));
    await unidades.guardar(u);
    const leida = (await unidades.obtener('u1'))!;
    expect([leida.fechaCompra, leida.fechaApertura, leida.caducidadFabricante, leida.fechaTerminado]).toEqual([
      fecha('2026-08-30'),
      fecha('2026-09-01'),
      fecha('2027-12-31'),
      fecha('2026-10-16'),
    ]);
  });
});

describe('SqliteAjustesRepositorio', () => {
  it('sin nada guardado devuelve los valores por defecto', async () => {
    const { ajustes } = await base();
    expect(await ajustes.obtenerAvisos()).toMatchObject({ activados: true, diasAntes: 7, hora: 10 });
    expect(await ajustes.obtenerIngredientes()).toEqual({ evitar: [] });
  });

  it('avisos e ingredientes se guardan por separado', async () => {
    const { ajustes } = await base();
    await ajustes.guardarAvisos({ activados: false, diasAntes: 3, hora: 21, minuto: 30, resumenSemanal: true });
    await ajustes.guardarIngredientes({ evitar: ['Parfum'], claveInci: 'sk_live_x' });
    expect(await ajustes.obtenerAvisos()).toEqual({ activados: false, diasAntes: 3, hora: 21, minuto: 30, resumenSemanal: true });
    expect(await ajustes.obtenerIngredientes()).toEqual({ evitar: ['Parfum'], claveInci: 'sk_live_x' });
  });
});

describe('SqliteCompraRepositorio', () => {
  it('vacía solo los comprados', async () => {
    const { compra } = await base();
    const a = new ArticuloCompra({ id: 'a', descripcion: 'Algodones', creadoEl: new Date() });
    const b = new ArticuloCompra({ id: 'b', descripcion: 'Desmaquillante', creadoEl: new Date() });
    b.marcarComprado(fecha('2026-10-16'));
    await compra.guardar(a);
    await compra.guardar(b);
    await compra.eliminarComprados();
    expect((await compra.listar()).map((x) => x.id)).toEqual(['a']);
  });
});
