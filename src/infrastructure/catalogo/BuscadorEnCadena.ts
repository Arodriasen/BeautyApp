import type { BuscadorPorNombre, ResultadoBusquedaNombre } from '@/application/CatalogoExterno';

import { normalizar } from '@/utils/texto';

/**
 * Busca por nombre en varias bases a la vez y junta los resultados sin repetir.
 * Las `principales` se consultan siempre y en paralelo. Las de `reserva` solo si entre las
 * principales salen menos de `minimo` resultados (UPCitemdb: para no gastar su cupo diario).
 * Solo lanza si fallan todas las consultadas.
 */
export class BuscadorEnCadena implements BuscadorPorNombre {
  constructor(
    private readonly principales: BuscadorPorNombre[],
    private readonly reserva: BuscadorPorNombre[] = [],
    private readonly minimo = 5,
    private readonly maximo = 30,
  ) {}

  async buscarPorNombre(texto: string): Promise<ResultadoBusquedaNombre[]> {
    if (texto.trim().length < 2) return [];

    const consultar = async (buscadores: BuscadorPorNombre[]) => {
      const r = await Promise.allSettled(buscadores.map((b) => b.buscarPorNombre(texto)));
      return {
        resultados: r.flatMap((x) => (x.status === 'fulfilled' ? x.value : [])),
        fallos: r.filter((x) => x.status === 'rejected') as PromiseRejectedResult[],
      };
    };

    const principal = await consultar(this.principales);
    let resultados = juntar(principal.resultados);
    let fallos = principal.fallos;
    let consultados = this.principales.length;

    if (resultados.length < this.minimo && this.reserva.length) {
      const extra = await consultar(this.reserva);
      resultados = juntar([...resultados, ...extra.resultados]);
      fallos = [...fallos, ...extra.fallos];
      consultados += this.reserva.length;
    }

    if (resultados.length === 0 && fallos.length === consultados) throw fallos[0].reason;
    return resultados.slice(0, this.maximo);
  }
}

/** Quita repetidos: mismo código de barras, o misma marca y nombre si no tienen código. */
function juntar(lista: ResultadoBusquedaNombre[]): ResultadoBusquedaNombre[] {
  const vistos = new Set<string>();
  return lista.filter((r) => {
    const clave = r.ean ?? `${normalizar(r.marca ?? '')}|${normalizar(r.nombre ?? '')}`;
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}
