import type {
  BuscadorDeTonos,
  BuscadorPorNombre,
  ResultadoBusquedaNombre,
  TonoSugerido,
} from '@/application/CatalogoExterno';
import type { Categoria } from '@/domain/productos/Categoria';
import { coincidePorPalabras, normalizar } from '@/utils/texto';

import { getJson, quitarMarca, soloHttps } from './http';
import { nombreDeMarca } from './marcas';

interface ProductoMakeup {
  brand?: string | null;
  name?: string | null;
  product_type?: string | null;
  image_link?: string | null;
  api_featured_image?: string | null;
  product_colors?: { hex_value?: string; colour_name?: string | null }[];
}

const TIPOS: Record<string, Categoria> = {
  blush: 'colorete',
  bronzer: 'bronceador',
  eyebrow: 'cejas',
  eyeliner: 'delineador',
  eyeshadow: 'sombras',
  foundation: 'base',
  lip_liner: 'perfilador',
  lipstick: 'labial',
  mascara: 'mascara',
  nail_polish: 'unas',
};

/** Algunos colores vienen como "gray7" o "#F7E2D1,#673E2C": nos quedamos con el primero válido. */
function colorValido(hex: string | undefined): string | undefined {
  const c = hex?.split(',')[0]?.trim().toUpperCase();
  return c && /^#[0-9A-F]{6}$/.test(c) ? c : undefined;
}

function tonosDe(p: ProductoMakeup): TonoSugerido[] {
  const vistos = new Set<string>();
  return (p.product_colors ?? []).flatMap((t) => {
    const color = colorValido(t.hex_value);
    const nombre = t.colour_name?.trim();
    if (!color) return [];
    const clave = `${color}|${nombre ?? ''}`;
    if (vistos.has(clave)) return [];
    vistos.add(clave);
    return [{ color, nombre: nombre || undefined }];
  });
}

/** Palabras que no dicen nada del producto. */
const VACIAS = new Set('the and for with in of de del la las el los y con para en a'.split(' '));

/** Lo escaneado suele venir en español; Makeup API está en inglés. */
const EN_INGLES: Record<string, string[]> = {
  labial: ['lipstick', 'lipcolour', 'lip'],
  labios: ['lip', 'lips'],
  barra: ['lipstick'],
  base: ['foundation'],
  maquillaje: ['makeup', 'foundation'],
  colorete: ['blush'],
  bronceador: ['bronzer'],
  bronceadores: ['bronzer'],
  polvos: ['powder'],
  delineador: ['eyeliner', 'liner'],
  perfilador: ['liner', 'lipliner'],
  sombra: ['eyeshadow', 'shadow'],
  sombras: ['eyeshadow', 'shadow'],
  ojos: ['eye'],
  esmalte: ['nail', 'polish'],
  unas: ['nail'],
  cejas: ['brow', 'eyebrow'],
  lapiz: ['pencil'],
  liquido: ['liquid'],
  liquida: ['liquid'],
  mate: ['matte'],
  crema: ['cream'],
  brillo: ['gloss'],
  corrector: ['concealer'],
  paleta: ['palette'],
};

function palabras(s: string, quitar: Set<string> = VACIAS): string[] {
  return normalizar(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((p) => p && !quitar.has(p));
}

function aResultado(p: ProductoMakeup): ResultadoBusquedaNombre | undefined {
  const nombre = p.name?.trim();
  if (!nombre) return undefined;
  const marca = p.brand ? nombreDeMarca(p.brand) : undefined;
  // `api_featured_image` viene sin protocolo ("//s3.amazonaws.com/…") y siempre está.
  const imagen = p.api_featured_image ? `https:${p.api_featured_image.replace(/^https?:/, '')}` : undefined;
  const tonos = tonosDe(p);
  return {
    marca,
    nombre: quitarMarca(nombre, marca),
    categoria: p.product_type ? TIPOS[p.product_type] : undefined,
    imagenUrl: soloHttps(imagen) ?? soloHttps(p.image_link ?? undefined),
    tonos: tonos.length ? tonos : undefined,
    fuente: 'Makeup API',
  };
}

/**
 * Makeup API (https://makeup-api.herokuapp.com): ~930 productos de maquillaje de 58 marcas,
 * con sus tonos y colores. Sin clave. No busca por texto ni tiene códigos de barras, así que
 * se descarga el catálogo entero (1,6 MB) una vez por sesión y se busca en el móvil.
 */
export class MakeupApi implements BuscadorPorNombre, BuscadorDeTonos {
  private catalogo?: Promise<ProductoMakeup[]>;

  constructor(private readonly url = 'https://makeup-api.herokuapp.com/api/v1/products.json') {}

  async buscarPorNombre(texto: string, limite = 20): Promise<ResultadoBusquedaNombre[]> {
    const productos = await this.cargar();
    return productos
      .filter((p) => coincidePorPalabras(`${p.brand ?? ''} ${p.name ?? ''} ${p.product_type?.replace('_', ' ') ?? ''}`, texto))
      .slice(0, limite)
      .flatMap((p) => aResultado(p) ?? []);
  }

  /**
   * Para un producto escaneado: busca en su catálogo uno de la misma marca con todas las palabras
   * de su nombre (al menos dos, tipo incluido: así un corrector no se lleva los tonos del bronceador
   * de la misma línea) dentro del nombre escaneado. Gana el más largo; si dos distintos empatan no
   * se arriesga: mejor sin tonos que con los de otro producto.
   */
  async buscarTonos(marca: string, nombre: string): Promise<TonoSugerido[] | undefined> {
    const productos = await this.cargar();
    const laMarca = normalizar(nombreDeMarca(marca));
    const delNombre = new Set(palabras(nombre).flatMap((p) => [p, ...(EN_INGLES[p] ?? [])]));
    let mejor: { tonos: TonoSugerido[]; clave: string } | undefined;
    let puntos = 0;
    let empate = false;
    for (const p of productos) {
      if (!p.brand || !p.name || normalizar(nombreDeMarca(p.brand)) !== laMarca) continue;
      // Sin la marca, que en Makeup API a veces va en el nombre ("NYX Soft Matte Lip Cream").
      const sinMarca = new Set([...VACIAS, ...palabras(p.brand), ...palabras(nombreDeMarca(p.brand))]);
      const suyas = palabras(p.name, sinMarca);
      if (suyas.length < 2 || !suyas.every((s) => delNombre.has(s))) continue;
      const tonos = tonosDe(p);
      if (!tonos.length) continue;
      const clave = [...suyas].sort().join(' ');
      if (suyas.length > puntos) {
        [mejor, puntos, empate] = [{ tonos, clave }, suyas.length, false];
      } else if (suyas.length === puntos && mejor) {
        // El mismo producto repetido no es duda: nos quedamos con el que trae más tonos.
        if (clave !== mejor.clave) empate = true;
        else if (tonos.length > mejor.tonos.length) mejor = { tonos, clave };
      }
    }
    return empate ? undefined : mejor?.tonos;
  }

  private cargar(): Promise<ProductoMakeup[]> {
    // 1,6 MB: más margen que una consulta normal.
    this.catalogo ??= getJson<ProductoMakeup[]>(this.url, {}, 25000).then((r) => r ?? []);
    // Si falla (sin conexión), se reintenta en la siguiente búsqueda.
    this.catalogo.catch(() => (this.catalogo = undefined));
    return this.catalogo;
  }
}
