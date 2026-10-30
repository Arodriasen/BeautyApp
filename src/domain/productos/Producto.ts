import { CATEGORIAS, type Categoria } from './Categoria';
import type { Ean } from './Ean';
import type { AnalisisIngredientes } from './Ingredientes';
import { Pao } from './Pao';

export interface DatosProducto {
  id: string;
  marca: string;
  nombre: string;
  categoria: Categoria;
  ean?: Ean;
  /** Tono o variante: "120 Ivory", "Rosewood"... */
  tono?: string;
  /** PAO impreso en el envase; si falta se usa el habitual de la categoría. */
  pao?: Pao;
  /** Referencia a la foto guardada en el móvil (la resuelve la infraestructura). */
  foto?: string;
  /** Color del tono como '#RRGGBB', para el punto de color de la miniatura. */
  colorTono?: string;
  /** Lista INCI, en el orden de la caja. */
  ingredientes?: string[];
  /** Último análisis de esa lista (se borra si la lista cambia). */
  analisis?: AnalisisIngredientes;
}

const HEX = /^#[0-9A-F]{6}$/;

function normalizarColor(color: string | undefined): string | undefined {
  if (!color) return undefined;
  const c = color.trim().toUpperCase();
  if (!HEX.test(c)) throw new Error(`Color no válido: "${color}"`);
  return c;
}

/** Ficha de un producto del catálogo (lo que se compra), independiente de cuántos botes tenga. */
export class Producto {
  readonly id: string;
  readonly marca: string;
  readonly nombre: string;
  readonly categoria: Categoria;
  readonly ean?: Ean;
  readonly tono?: string;
  readonly pao?: Pao;
  readonly foto?: string;
  readonly colorTono?: string;
  readonly ingredientes?: string[];
  readonly analisis?: AnalisisIngredientes;

  constructor(datos: DatosProducto) {
    const marca = datos.marca.trim();
    const nombre = datos.nombre.trim();
    if (!marca) throw new Error('La marca es obligatoria');
    if (!nombre) throw new Error('El nombre es obligatorio');

    this.id = datos.id;
    this.marca = marca;
    this.nombre = nombre;
    this.categoria = datos.categoria;
    this.ean = datos.ean;
    this.tono = datos.tono?.trim() || undefined;
    this.pao = datos.pao;
    this.foto = datos.foto || undefined;
    this.colorTono = normalizarColor(datos.colorTono);
    this.ingredientes = datos.ingredientes?.length ? [...datos.ingredientes] : undefined;
    this.analisis = datos.analisis;
  }

  conFoto(foto: string | undefined): Producto {
    return new Producto({ ...this, foto });
  }

  conColorTono(colorTono: string | undefined): Producto {
    return new Producto({ ...this, colorTono });
  }

  /** Cambiar la lista invalida el análisis anterior. */
  conIngredientes(ingredientes: string[] | undefined): Producto {
    return new Producto({ ...this, ingredientes, analisis: undefined });
  }

  conAnalisis(analisis: AnalisisIngredientes | undefined): Producto {
    return new Producto({ ...this, analisis });
  }

  /** PAO a aplicar: el del envase o, si no lo tiene, el habitual de su categoría. */
  get paoEfectivo(): Pao | undefined {
    if (this.pao) return this.pao;
    const habitual = CATEGORIAS[this.categoria].paoHabitual;
    return habitual === null ? undefined : Pao.crear(habitual);
  }
}
