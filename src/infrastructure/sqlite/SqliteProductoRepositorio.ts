import type { SQLiteDatabase } from 'expo-sqlite';

import { CATEGORIAS, type Categoria } from '@/domain/productos/Categoria';
import { Ean } from '@/domain/productos/Ean';
import type { AnalisisIngredientes } from '@/domain/productos/Ingredientes';
import { Pao } from '@/domain/productos/Pao';
import { Producto } from '@/domain/productos/Producto';
import type { ProductoRepositorio } from '@/domain/productos/ProductoRepositorio';

interface FilaProducto {
  id: string;
  marca: string;
  nombre: string;
  categoria: string;
  ean: string | null;
  tono: string | null;
  pao_meses: number | null;
  foto: string | null;
  color_tono: string | null;
  /** JSON: string[] */
  ingredientes: string | null;
  /** JSON: AnalisisIngredientes con la fecha en ISO */
  analisis_ingredientes: string | null;
}

function leerJson<T>(texto: string | null): T | undefined {
  if (!texto) return undefined;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return undefined;
  }
}

function leerAnalisis(texto: string | null): AnalisisIngredientes | undefined {
  const a = leerJson<Omit<AnalisisIngredientes, 'fecha'> & { fecha: string }>(texto);
  return a ? { ...a, alergenos: a.alergenos ?? [], fecha: new Date(a.fecha) } : undefined;
}

function aProducto(f: FilaProducto): Producto {
  return new Producto({
    id: f.id,
    marca: f.marca,
    nombre: f.nombre,
    categoria: f.categoria in CATEGORIAS ? (f.categoria as Categoria) : 'otro',
    ean: f.ean ? Ean.crear(f.ean) : undefined,
    tono: f.tono ?? undefined,
    pao: f.pao_meses ? Pao.crear(f.pao_meses) : undefined,
    foto: f.foto ?? undefined,
    colorTono: f.color_tono ?? undefined,
    ingredientes: leerJson<string[]>(f.ingredientes),
    analisis: leerAnalisis(f.analisis_ingredientes),
  });
}

export class SqliteProductoRepositorio implements ProductoRepositorio {
  constructor(private readonly db: SQLiteDatabase) {}

  async guardar(p: Producto): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO productos (id, marca, nombre, categoria, ean, tono, pao_meses, foto, color_tono,
                              ingredientes, analisis_ingredientes)
       VALUES ($id, $marca, $nombre, $categoria, $ean, $tono, $pao, $foto, $color, $ingredientes, $analisis)
       ON CONFLICT (id) DO UPDATE SET
         marca = excluded.marca, nombre = excluded.nombre, categoria = excluded.categoria,
         ean = excluded.ean, tono = excluded.tono, pao_meses = excluded.pao_meses, foto = excluded.foto,
         color_tono = excluded.color_tono, ingredientes = excluded.ingredientes,
         analisis_ingredientes = excluded.analisis_ingredientes`,
      {
        $id: p.id,
        $marca: p.marca,
        $nombre: p.nombre,
        $categoria: p.categoria,
        $ean: p.ean?.valor ?? null,
        $tono: p.tono ?? null,
        $pao: p.pao?.meses ?? null,
        $foto: p.foto ?? null,
        $color: p.colorTono ?? null,
        $ingredientes: p.ingredientes ? JSON.stringify(p.ingredientes) : null,
        $analisis: p.analisis ? JSON.stringify(p.analisis) : null,
      },
    );
  }

  async obtener(id: string): Promise<Producto | undefined> {
    const fila = await this.db.getFirstAsync<FilaProducto>('SELECT * FROM productos WHERE id = ?', id);
    return fila ? aProducto(fila) : undefined;
  }

  async buscarPorEan(ean: Ean): Promise<Producto | undefined> {
    const fila = await this.db.getFirstAsync<FilaProducto>('SELECT * FROM productos WHERE ean = ?', ean.valor);
    return fila ? aProducto(fila) : undefined;
  }

  async listar(): Promise<Producto[]> {
    const filas = await this.db.getAllAsync<FilaProducto>('SELECT * FROM productos');
    return filas.map(aProducto);
  }

  async eliminar(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM productos WHERE id = ?', id);
  }
}
