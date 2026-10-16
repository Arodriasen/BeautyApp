import type { CatalogoExterno, FichaExterna } from '@/application/CatalogoExterno';
import type { Ean } from '@/domain/productos/Ean';

/**
 * Pregunta a cada catálogo por orden y se queda con el primero que lo conozca.
 * Si a esa ficha le falta la categoría, sigue preguntando a los demás solo para
 * completar los huecos (lo que ya tiene no se pisa).
 *
 * Si uno falla (sin conexión, límite superado...) pasa al siguiente; solo lanza
 * si han fallado todos, para que la app pueda decir "no hay conexión".
 */
export class CatalogoEnCadena implements CatalogoExterno {
  constructor(private readonly catalogos: CatalogoExterno[]) {}

  async buscar(ean: Ean): Promise<FichaExterna | undefined> {
    let fallos = 0;
    let ultimoError: unknown;
    let ficha: FichaExterna | undefined;

    for (const catalogo of this.catalogos) {
      if (ficha?.categoria) break;
      try {
        const otra = await catalogo.buscar(ean);
        if (!otra?.nombre) continue;
        ficha = ficha ? completar(ficha, otra) : otra;
      } catch (e) {
        fallos++;
        ultimoError = e;
      }
    }

    if (!ficha && fallos === this.catalogos.length) throw ultimoError;
    return ficha;
  }
}

function completar(base: FichaExterna, extra: FichaExterna): FichaExterna {
  return {
    ...base,
    marca: base.marca ?? extra.marca,
    categoria: base.categoria ?? extra.categoria,
    paoMeses: base.paoMeses ?? extra.paoMeses,
    imagenUrl: base.imagenUrl ?? extra.imagenUrl,
  };
}
