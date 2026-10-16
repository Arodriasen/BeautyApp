import { Unidad } from '@/domain/inventario/Unidad';
import { Pao } from '@/domain/productos/Pao';
import { Producto } from '@/domain/productos/Producto';
import { fecha } from '@/test-utils/en-memoria';

import { AJUSTES_POR_DEFECTO, MAX_AVISOS, planificarAvisos, type BoteEnUso } from '../PlanificadorAvisos';

// Viernes 16/10/2026 a las 12:00
const AHORA = new Date(2026, 9, 16, 12, 0);
const a = (iso: string, hora = 10) => {
  const d = fecha(iso);
  d.setHours(hora);
  return d;
};

let n = 0;
/** Bote abierto el día indicado de un producto con PAO de 1 mes → caduca un mes después. */
function bote(abierto: string, nombre = `P${++n}`, marca = 'Marca'): BoteEnUso {
  const producto = new Producto({ id: nombre, marca, nombre, categoria: 'otro', pao: Pao.crear(1) });
  const unidad = new Unidad({ id: `u-${nombre}`, productoId: producto.id, fechaApertura: fecha(abierto) });
  return { producto, unidad };
}

describe('planificarAvisos', () => {
  it('programa un aviso 7 días antes y otro el día, a las 10:00', () => {
    const avisos = planificarAvisos([bote('2026-10-30', 'Sérum', 'Ordinary')], AJUSTES_POR_DEFECTO, AHORA);
    expect(avisos).toEqual([
      {
        id: expect.stringMatching(/^previo-/),
        fecha: a('2026-11-23'),
        titulo: 'Caduca en 7 días',
        cuerpo: 'Ordinary Sérum caduca el 30/11.',
        productoId: 'Sérum',
      },
      {
        id: expect.stringMatching(/^dia-/),
        fecha: a('2026-11-30'),
        titulo: 'Hoy caduca',
        cuerpo: 'Ordinary Sérum: toca renovarlo.',
        productoId: 'Sérum',
      },
    ]);
  });

  it('no programa lo que ya ha pasado', () => {
    // Caduca el 20/10: el aviso previo (13/10) ya pasó; queda el del día.
    expect(planificarAvisos([bote('2026-09-20')], AJUSTES_POR_DEFECTO, AHORA).map((x) => x.fecha)).toEqual([
      a('2026-10-20'),
    ]);
    // Caducado: nada.
    expect(planificarAvisos([bote('2026-08-01')], AJUSTES_POR_DEFECTO, AHORA)).toEqual([]);
  });

  it('agrupa los productos que caducan el mismo día', () => {
    const avisos = planificarAvisos(
      [bote('2026-10-30', 'Base'), bote('2026-10-30', 'Labial'), bote('2026-10-30', 'Gloss'), bote('2026-10-30', 'Kohl')],
      AJUSTES_POR_DEFECTO,
      AHORA,
    );
    expect(avisos).toHaveLength(2);
    expect(avisos[1]).toMatchObject({
      titulo: 'Hoy caducan 4 productos',
      cuerpo: 'Marca Base, Marca Labial, Marca Gloss y 1 más',
      productoId: undefined,
    });
  });

  it('respeta la antelación y la hora elegidas', () => {
    const avisos = planificarAvisos(
      [bote('2026-10-30')],
      { ...AJUSTES_POR_DEFECTO, diasAntes: 1, hora: 21, minuto: 30 },
      AHORA,
    );
    expect(avisos.map((x) => [x.titulo, x.fecha])).toEqual([
      ['Caduca mañana', new Date(2026, 10, 29, 21, 30)],
      ['Hoy caduca', new Date(2026, 10, 30, 21, 30)],
    ]);
  });

  it('ignora botes sin fecha límite (sin abrir) y no avisa si están desactivados', () => {
    const sinAbrir: BoteEnUso = {
      producto: new Producto({ id: 'x', marca: 'M', nombre: 'N', categoria: 'base' }),
      unidad: new Unidad({ id: 'u', productoId: 'x' }),
    };
    expect(planificarAvisos([sinAbrir], AJUSTES_POR_DEFECTO, AHORA)).toEqual([]);
    expect(planificarAvisos([bote('2026-10-30')], { ...AJUSTES_POR_DEFECTO, activados: false }, AHORA)).toEqual([]);
  });

  it('añade el resumen de los domingos si está activado', () => {
    // Caducan el miércoles 4/11 y el viernes 6/11 → resumen el domingo 1/11.
    const avisos = planificarAvisos(
      [bote('2026-10-04', 'A'), bote('2026-10-06', 'B')],
      { ...AJUSTES_POR_DEFECTO, resumenSemanal: true },
      AHORA,
    );
    const resumenes = avisos.filter((x) => x.id.startsWith('semana-'));
    expect(resumenes).toEqual([
      expect.objectContaining({ fecha: a('2026-11-01'), titulo: 'Esta semana caducan 2 productos', cuerpo: 'Marca A, Marca B' }),
    ]);
  });

  it(`no pasa de ${MAX_AVISOS} avisos y deja los más próximos`, () => {
    const muchos = Array.from({ length: 40 }, (_, i) => bote(`2026-11-${String((i % 28) + 1).padStart(2, '0')}`, `X${i}`));
    const avisos = planificarAvisos(muchos, AJUSTES_POR_DEFECTO, AHORA);
    expect(avisos).toHaveLength(MAX_AVISOS);
    expect([...avisos].sort((x, y) => x.fecha.getTime() - y.fecha.getTime())).toEqual(avisos);
  });
});
