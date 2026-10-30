/**
 * Las bases de datos escriben las marcas de mil formas: "maybelline", "Maybelline New York",
 * "MAYBELLINE", "L'OREAL NORGE AS"… Aquí se unifican y se quitan del nombre del producto.
 */

const sinTildes = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Nombre con el que se muestra cada marca y las variantes con que aparece (sin tildes, en minúsculas). */
const MARCAS: [string, string[]][] = [
  ['Maybelline', ['maybelline new york', 'maybelline ny', 'maybelline']],
  ['NYX', ['nyx professional makeup', 'nyx cosmetics', 'nyx']],
  ["L'Oréal Paris", ["l'oreal paris", "l'oreal", 'loreal paris', 'loreal']],
  ['Lancôme', ['lancome']],
  ['Estée Lauder', ['estee lauder']],
  ['Clinique', ['clinique']],
  ['MAC', ['mac cosmetics', 'm.a.c', 'mac']],
  ['Benefit', ['benefit cosmetics', 'benefit']],
  ['Rimmel', ['rimmel london', 'rimmel']],
  ['Max Factor', ['max factor']],
  ['Bourjois', ['bourjois paris', 'bourjois']],
  ['Revlon', ['revlon']],
  ['Essence', ['essence cosmetics', 'essence']],
  ['Catrice', ['catrice cosmetics', 'catrice']],
  ['Kiko Milano', ['kiko milano', 'kiko']],
  ['Fenty Beauty', ['fenty beauty by rihanna', 'fenty beauty', 'fenty']],
  ['Rare Beauty', ['rare beauty by selena gomez', 'rare beauty']],
  ['Charlotte Tilbury', ['charlotte tilbury']],
  ['Too Faced', ['too faced cosmetics', 'too faced']],
  ['Urban Decay', ['urban decay']],
  ['Dior', ['christian dior', 'dior']],
  ['Chanel', ['chanel']],
  ['Yves Saint Laurent', ['yves saint laurent beaute', 'yves saint laurent', 'ysl']],
  ['Glossier', ['glossier']],
  ['e.l.f.', ['e.l.f. cosmetics', 'elf cosmetics', 'e.l.f.', 'elf']],
  ['Smashbox', ['smashbox']],
  ['Stila', ['stila cosmetics', 'stila']],
  ['ColourPop', ['colourpop cosmetics', 'colourpop']],
  ['The Ordinary', ['the ordinary', 'deciem the ordinary']],
  ['CeraVe', ['cerave']],
  ['La Roche-Posay', ['la roche-posay', 'la roche posay']],
  ['Bioderma', ['bioderma']],
  ['Vichy', ['vichy']],
  ['Nivea', ['nivea']],
  ['Garnier', ['garnier']],
  ['Neutrogena', ['neutrogena']],
  ['Avène', ['eau thermale avene', 'avene']],
  ['Isdin', ['isdin']],
  ['Sephora Collection', ['sephora collection', 'sephora']],
  ['Deliplus', ['deliplus']],
];

/** Cada variante → nombre bonito; las más largas primero para quitar "maybelline new york" entero. */
const VARIANTES = MARCAS.flatMap(([nombre, variantes]) => variantes.map((v) => [v, nombre] as const)).sort(
  (a, b) => b[0].length - a[0].length,
);

const CANONICA = new Map(VARIANTES);

const tituloDe = (s: string) => s.toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toUpperCase());

/** Nombre de marca unificado. Lo desconocido en todo minúsculas o MAYÚSCULAS pasa a Título. */
export function nombreDeMarca(marca: string): string {
  const limpia = marca.trim().replace(/\s+/g, ' ');
  const conocida = CANONICA.get(sinTildes(limpia));
  if (conocida) return conocida;
  // Empresas distribuidoras que se cuelan como marca: "L'OREAL NORGE AS" → "L'Oréal Paris".
  const prefijo = VARIANTES.find(([v]) => sinTildes(limpia).startsWith(`${v} `));
  if (prefijo && /\b(as|sa|sl|ltd|inc|gmbh|spa|bv|ab)\b\.?$/i.test(limpia)) return prefijo[1];
  const tieneMezcla = limpia !== limpia.toLowerCase() && limpia !== limpia.toUpperCase();
  return tieneMezcla || limpia.length <= 3 ? limpia : tituloDe(limpia);
}

/**
 * Quita del principio del nombre la marca o cualquiera de sus variantes:
 * "Maybelline New York Lash Sensational" con marca Maybelline → "Lash Sensational".
 */
export function quitarMarcaDelNombre(nombre: string, marca: string | undefined): string {
  const n = nombre.trim().replace(/\s+/g, ' ');
  if (!marca) return n;
  const objetivo = nombreDeMarca(marca);
  const candidatas = [
    ...VARIANTES.filter(([, canonica]) => canonica === objetivo).map(([v]) => v),
    sinTildes(marca),
  ].sort((a, b) => b.length - a.length);
  const base = sinTildes(n);
  for (const v of candidatas) {
    if (base.startsWith(v) && (base.length === v.length || /[\s\-–:·,]/.test(base[v.length]))) {
      const resto = n.slice(v.length).replace(/^[\s\-–:·,]+/, '');
      if (resto) return resto;
    }
  }
  return n;
}
