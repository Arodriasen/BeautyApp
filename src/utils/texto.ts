/** Sin tildes ni mayúsculas, para que "serum" encuentre "Sérum". */
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** ¿Contiene `texto` todas las palabras de `busqueda` (en cualquier orden)? */
export function coincide(texto: string, busqueda: string): boolean {
  const t = normalizar(texto);
  return normalizar(busqueda)
    .split(/\s+/)
    .filter(Boolean)
    .every((palabra) => t.includes(palabra));
}

/**
 * Más estricta que `coincide`: cada palabra buscada tiene que ser el principio de alguna palabra
 * del texto. Así «fit me» no encuentra «Benefit Gimme Brow».
 */
export function coincidePorPalabras(texto: string, busqueda: string): boolean {
  const palabras = normalizar(texto).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return normalizar(busqueda)
    .split(/\s+/)
    .filter(Boolean)
    .every((b) => palabras.some((p) => p.startsWith(b)));
}
