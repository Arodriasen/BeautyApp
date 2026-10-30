/**
 * Ingredientes en nomenclatura INCI (la lista de la caja: "Aqua, Glycerin, Parfum…").
 */

export type NivelSeguridad = 'safe' | 'low_risk' | 'moderate' | 'high_risk' | 'hazardous';

/** Resultado de analizar la lista con una base de datos externa (INCI API). */
export interface AnalisisIngredientes {
  /** De 1 (peor) a 10 (mejor). */
  puntuacion?: number;
  nivel?: NivelSeguridad;
  /** Alérgenos de declaración obligatoria en la UE presentes en el producto. */
  alergenos: string[];
  /** `undefined` = sin datos. */
  aptoEmbarazo?: boolean;
  fecha: Date;
}

const sinTildes = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Convierte el texto de la caja en una lista. Acepta comas, punto y coma, viñetas o saltos
 * de línea, quita el encabezado ("Ingredients:", "Ingredientes:") y los duplicados.
 * Las comas dentro de paréntesis no separan: "Parfum (Fragrance, Aroma)" es uno solo.
 */
export function parsearListaInci(texto: string): string[] {
  const limpio = texto.replace(/^\s*(ingredients?|ingredientes|ingr[eé]dients|inci)\s*[:：]\s*/i, '');
  const partes: string[] = [];
  let actual = '';
  let profundidad = 0;
  for (const c of limpio) {
    if (c === '(' || c === '[') profundidad++;
    if (c === ')' || c === ']') profundidad = Math.max(0, profundidad - 1);
    if (profundidad === 0 && /[,;•·\n\r]/.test(c)) {
      partes.push(actual);
      actual = '';
    } else {
      actual += c;
    }
  }
  partes.push(actual);

  const vistos = new Set<string>();
  return partes
    .map((p) => p.replace(/\s+/g, ' ').replace(/^[\s*.\-–]+|[\s*.]+$/g, '').trim())
    .filter((p) => {
      const clave = sinTildes(p);
      if (!p || vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
}

/**
 * Ingredientes de `lista` que contienen alguno de los términos que se quieren evitar.
 * Es por fragmento y sin tildes: "paraben" encuentra "Methylparaben" y "Propylparaben".
 */
export function ingredientesEvitados(lista: readonly string[], evitar: readonly string[]): string[] {
  const terminos = evitar.map((t) => sinTildes(t.trim())).filter(Boolean);
  if (terminos.length === 0) return [];
  return lista.filter((ingrediente) => {
    const i = sinTildes(ingrediente);
    return terminos.some((t) => i.includes(t));
  });
}

/** ¿Es este ingrediente uno de los alérgenos detectados? (comparación sin tildes ni mayúsculas) */
export function esAlergeno(ingrediente: string, alergenos: readonly string[]): boolean {
  const i = sinTildes(ingrediente);
  return alergenos.some((a) => {
    const x = sinTildes(a);
    return i === x || i.includes(x);
  });
}
