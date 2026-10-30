import type { AnalisisIngredientes } from '@/domain/productos/Ingredientes';
import type { Ean } from '@/domain/productos/Ean';

/** Una base de datos que sabe la lista de ingredientes de un código de barras (Open Beauty Facts). */
export interface FuenteIngredientes {
  /** `undefined` si no la conoce. Lanza si no se ha podido consultar. */
  ingredientes(ean: Ean): Promise<string[] | undefined>;
}

/** Análisis de seguridad de una lista de ingredientes (INCI API). Necesita clave. */
export interface AnalizadorIngredientes {
  /** Busca el producto por código: devuelve su lista y el análisis, o `undefined` si no lo tiene. */
  porCodigo(ean: Ean, clave: string): Promise<{ ingredientes: string[]; analisis: AnalisisIngredientes } | undefined>;
  analizar(ingredientes: string[], clave: string): Promise<AnalisisIngredientes>;
}

export interface AjustesIngredientes {
  /** Términos a evitar tal como los escribe ella ("perfume", "paraben"…). */
  evitar: string[];
  /** Clave de INCI API (se guarda solo en el móvil). */
  claveInci?: string;
}

export const AJUSTES_INGREDIENTES_POR_DEFECTO: AjustesIngredientes = { evitar: [] };

export interface AjustesIngredientesRepositorio {
  obtenerIngredientes(): Promise<AjustesIngredientes>;
  guardarIngredientes(ajustes: AjustesIngredientes): Promise<void>;
}
