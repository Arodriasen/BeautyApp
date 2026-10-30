import type { BuscadorPorNombre, ResultadoBusquedaNombre } from '@/application/CatalogoExterno';

import { BuscadorEnCadena } from '../BuscadorEnCadena';
import { OpenBeautyFacts } from '../OpenBeautyFacts';
import { UpcItemDb } from '../UpcItemDb';

function responder(cuerpo: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({ status: 200, ok: true, json: async () => cuerpo }) as unknown as typeof fetch;
}
const url = () => (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;

const r = (nombre: string, ean?: string, fuente = 'A'): ResultadoBusquedaNombre => ({ nombre, ean, fuente });
const fijo = (lista: ResultadoBusquedaNombre[]): BuscadorPorNombre => ({ buscarPorNombre: jest.fn(async () => lista) });
const falla: BuscadorPorNombre = {
  buscarPorNombre: async () => {
    throw new Error('sin red');
  },
};

describe('OpenBeautyFacts.buscarPorNombre', () => {
  it('busca por texto y traduce los resultados', async () => {
    responder({
      products: [
        {
          code: '3600531143459',
          brands: 'Maybelline',
          product_name: 'Maybelline New York Lash Sensational Very Black',
          categories_tags: ['en:makeup', 'en:mascara'],
        },
        { code: '1', product_name: '' },
      ],
    });
    const res = await new OpenBeautyFacts().buscarPorNombre('lash sensational');
    expect(url()).toContain('/cgi/search.pl?search_terms=lash%20sensational');
    expect(res).toEqual([
      expect.objectContaining({ marca: 'Maybelline', nombre: 'Lash Sensational Very Black', categoria: 'mascara', ean: '3600531143459' }),
    ]);
  });
});

it('UpcItemDb.buscarPorNombre usa el buscador de prueba', async () => {
  responder({ code: 'OK', items: [{ ean: '0041554541045', title: 'Maybelline Lash Sensational Mascara', brand: 'Maybelline' }] });
  const [p] = await new UpcItemDb().buscarPorNombre('lash');
  expect(url()).toContain('/prod/trial/search?s=lash');
  expect(p).toMatchObject({ ean: '0041554541045', nombre: 'Lash Sensational Mascara', fuente: 'UPCitemdb' });
});


describe('BuscadorEnCadena', () => {
  it('junta las principales sin repetir (mismo código o misma marca y nombre)', async () => {
    const res = await new BuscadorEnCadena([
      fijo([r('Lash', '1'), r('Gel')]),
      fijo([r('Lash otra fuente', '1'), r('gel'), r('Crema', '2')]),
    ]).buscarPorNombre('ab');
    expect(res.map((x) => x.nombre)).toEqual(['Lash', 'Gel', 'Crema']);
  });

  it('solo consulta la reserva si hay pocos resultados', async () => {
    const reserva = fijo([r('Extra', '9')]);
    const muchos = Array.from({ length: 6 }, (_, i) => r(`P${i}`, String(i)));
    await new BuscadorEnCadena([fijo(muchos)], [reserva]).buscarPorNombre('ab');
    expect(reserva.buscarPorNombre).not.toHaveBeenCalled();

    const res = await new BuscadorEnCadena([fijo([r('Uno', '1')])], [reserva]).buscarPorNombre('ab');
    expect(res.map((x) => x.nombre)).toEqual(['Uno', 'Extra']);
  });

  it('tolera fallos sueltos y solo lanza si fallan todas', async () => {
    expect(await new BuscadorEnCadena([falla, fijo([r('Uno', '1')])]).buscarPorNombre('ab')).toHaveLength(1);
    await expect(new BuscadorEnCadena([falla], [falla]).buscarPorNombre('ab')).rejects.toThrow('sin red');
  });

  it('no busca con menos de dos letras', async () => {
    const b = fijo([r('Uno')]);
    expect(await new BuscadorEnCadena([b]).buscarPorNombre(' a ')).toEqual([]);
    expect(b.buscarPorNombre).not.toHaveBeenCalled();
  });
});

it('UpcItemDb descarta resultados que no contienen las palabras buscadas', async () => {
  responder({
    code: 'OK',
    items: [
      { ean: '0100145002898', title: 'Autumn Owl Welcome Mat, Coir Fiber Doormat', brand: 'Avera Products' },
      { ean: '0041554541045', title: 'Maybelline Lash Sensational Mascara Very Black', brand: 'Maybelline' },
    ],
  });
  const res = await new UpcItemDb().buscarPorNombre('lash sensational');
  expect(res.map((x) => x.marca)).toEqual(['Maybelline']);
});
