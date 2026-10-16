import type { Categoria } from '@/domain/productos/Categoria';

/**
 * Traduce las categorías de las bases de datos externas (en inglés, a veces en español)
 * a las nuestras. El orden importa: las reglas más específicas van antes.
 */
const REGLAS: [RegExp, Categoria][] = [
  [/mascaras?\b|m[aá]scara de pesta|r[ií]mel/, 'mascara'],
  [/lip-?liner|perfilador/, 'perfilador'],
  [/eye-?liner|delineador|k[oh]{2}l/, 'delineador'],
  [/make-?up-remover|micellar|desmaquill/, 'desmaquillante'],
  [/lip-?gloss|\bgloss/, 'gloss'],
  [/lipstick|lip-?stick|labial|pintalabios|lip-colou?r|lip-tint|liquid-lip/, 'labial'],
  [/eye-?shadow|sombras?\b/, 'sombras'],
  [/brow|ceja/, 'cejas'],
  [/concealer|corrector/, 'corrector'],
  [/primer|prebase/, 'prebase'],
  [/setting-spray|fixing|fijador/, 'fijador'],
  [/foundation|skin-tint|bb-cream|cc-cream|fond-de-teint|base de maquillaje/, 'base'],
  [/blush|colorete/, 'colorete'],
  [/bronz/, 'bronceador'],
  [/highlight|iluminador/, 'iluminador'],
  [/powder|polvos/, 'polvos'],
  [/cleans|limpiador|face-?wash/, 'limpiador'],
  [/toner|t[oó]nico/, 'tonico'],
  [/s[eé]rum/, 'serum'],
  [/eye-cream|eye-contour|contorno/, 'contornoOjos'],
  [/sunscreen|sun-?protect|spf|protector solar/, 'protectorSolar'],
  [/mask|mascarilla/, 'mascarilla'],
  [/scrub|exfoli|peeling/, 'exfoliante'],
  [/moistur|face-?cream|day-cream|night-cream|hidratante|crema facial/, 'hidratante'],
  [/nail|u[ñn]as|esmalte/, 'unas'],
  [/shampoo|conditioner|hair|champ[uú]|cabello/, 'cabello'],
  [/perfume|fragrance|eau-de|parfum|colonia/, 'perfume'],
  [/body|shower|bath|deodorant|hand-cream|corporal|ducha/, 'corporal'],
  [/brush|sponge|brocha|esponja|accessor/, 'accesorio'],
];

/**
 * `textos` va de lo general a lo específico (como los `categories_tags` de Open Beauty Facts
 * o la ruta "Beauty > Makeup > Eyeliner" de UPCitemdb); se mira primero lo más específico.
 */
export function categoriaDesde(textos: string[]): Categoria | undefined {
  for (const texto of [...textos].reverse()) {
    const normalizado = texto.toLowerCase().replace(/[\s_]+/g, '-');
    const regla = REGLAS.find(([patron]) => patron.test(normalizado) || patron.test(texto.toLowerCase()));
    if (regla) return regla[1];
  }
  return undefined;
}
