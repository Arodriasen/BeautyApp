import type { CatalogoExterno } from '@/application/CatalogoExterno';
import { Ean } from '@/domain/productos/Ean';

import { CatalogoEnCadena } from '../CatalogoEnCadena';
import { quitarMarca } from '../http';
import { categoriaDesde } from '../mapeo-categorias';
import { OpenBeautyFacts } from '../OpenBeautyFacts';
import { UpcItemDb } from '../UpcItemDb';

const EAN = Ean.crear('0800897197148');

function responder(status: number, cuerpo: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => cuerpo,
  }) as unknown as typeof fetch;
}

describe('categoriaDesde', () => {
  it.each([
    [['en:eyes', 'en:makeup', 'en:eyes-makeup', 'en:eyeliners'], 'delineador'],
    [['en:makeup', 'en:face-makeup', 'en:foundations'], 'base'],
    [['en:makeup', 'en:mascaras'], 'mascara'],
    [['en:face', 'en:face-masks'], 'mascarilla'],
    [['en:makeup', 'en:lips', 'en:lip-liners'], 'perfilador'],
    [['en:eye-makeup-removers'], 'desmaquillante'],
    [['en:sun-protection', 'en:sunscreens'], 'protectorSolar'],
    [['Health & Beauty ', ' Cosmetics ', ' Eye Makeup ', ' Eyeliner'], 'delineador'],
    [['en:hygiene', 'en:toothpastes'], undefined],
  ])('%j → %s', (tags, esperada) => {
    expect(categoriaDesde(tags)).toBe(esperada);
  });
});

it('quitarMarca limpia el prefijo de la marca', () => {
  expect(quitarMarca('NYX Professional Makeup Epic Wear', 'NYX Professional Makeup')).toBe('Epic Wear');
  expect(quitarMarca('Maybelline - Lash Sensational', 'maybelline')).toBe('Lash Sensational');
  expect(quitarMarca('Epic Wear', 'NYX')).toBe('Epic Wear');
  expect(quitarMarca('NYX', 'NYX')).toBe('NYX');
});

describe('OpenBeautyFacts', () => {
  it('traduce la respuesta real de la API', async () => {
    responder(200, {
      code: '0800897197148',
      status: 1,
      product: {
        brands: 'NYX',
        categories_tags: ['en:eyes', 'en:makeup', 'en:eyes-makeup', 'en:eyeliners', 'nl:Beauty'],
        image_front_small_url: 'https://images.openbeautyfacts.org/images/products/080/089/719/7148/front_nl.8.200.jpg',
        product_name: 'NYX Professional Makeup Epic Wear 01 Black Waterproof Liquid Eyeliner',
        periods_after_opening_tags: ['en:6-months'],
      },
    });
    expect(await new OpenBeautyFacts().buscar(EAN)).toEqual({
      marca: 'NYX',
      nombre: 'Professional Makeup Epic Wear 01 Black Waterproof Liquid Eyeliner',
      categoria: 'delineador',
      paoMeses: 6,
      imagenUrl: 'https://images.openbeautyfacts.org/images/products/080/089/719/7148/front_nl.8.200.jpg',
      fuente: 'Open Beauty Facts',
    });
    expect((globalThis.fetch as jest.Mock).mock.calls[0][0]).toContain('/api/v2/product/0800897197148.json');
  });

  it('devuelve undefined si no lo conoce', async () => {
    responder(200, { code: '0800897197148', status: 0, status_verbose: 'product not found' });
    expect(await new OpenBeautyFacts().buscar(EAN)).toBeUndefined();
    responder(404, {});
    expect(await new OpenBeautyFacts().buscar(EAN)).toBeUndefined();
  });

  it('lanza si el servidor falla', async () => {
    responder(503, {});
    await expect(new OpenBeautyFacts().buscar(EAN)).rejects.toThrow('HTTP 503');
  });
});

describe('UpcItemDb', () => {
  it('traduce la respuesta y descarta imágenes http', async () => {
    responder(200, {
      code: 'OK',
      total: 1,
      items: [
        {
          title: 'NYX Professional Makeup Epic Wear Liquid Liner Long-lasting Waterproof Eyeliner - Black',
          brand: 'NYX Professional Makeup',
          category: 'Health & Beauty > Personal Care > Cosmetics > Makeup > Eye Makeup > Eyeliner',
          images: ['http://inseguro.example/a.jpg', 'https://seguro.example/b.jpg'],
        },
      ],
    });
    expect(await new UpcItemDb().buscar(EAN)).toEqual({
      marca: 'NYX Professional Makeup',
      nombre: 'Epic Wear Liquid Liner Long-lasting Waterproof Eyeliner - Black',
      categoria: 'delineador',
      imagenUrl: 'https://seguro.example/b.jpg',
      fuente: 'UPCitemdb',
    });
  });

  it('devuelve undefined si no hay resultados', async () => {
    responder(200, { code: 'OK', total: 0, items: [] });
    expect(await new UpcItemDb().buscar(EAN)).toBeUndefined();
  });
});

describe('CatalogoEnCadena', () => {
  const sabe = (fuente: string): CatalogoExterno => ({ buscar: async () => ({ nombre: 'X', fuente }) });
  const noSabe: CatalogoExterno = { buscar: async () => undefined };
  const falla: CatalogoExterno = {
    buscar: async () => {
      throw new Error('sin red');
    },
  };

  it('se queda con el primero que lo conoce', async () => {
    expect((await new CatalogoEnCadena([noSabe, sabe('A'), sabe('B')]).buscar(EAN))?.fuente).toBe('A');
  });

  it('salta los que fallan', async () => {
    expect((await new CatalogoEnCadena([falla, sabe('B')]).buscar(EAN))?.fuente).toBe('B');
    expect(await new CatalogoEnCadena([falla, noSabe]).buscar(EAN)).toBeUndefined();
  });

  it('lanza solo si fallan todos', async () => {
    await expect(new CatalogoEnCadena([falla, falla]).buscar(EAN)).rejects.toThrow('sin red');
  });

  it('completa la categoría con el siguiente catálogo sin pisar lo que ya tiene', async () => {
    const sinCategoria: CatalogoExterno = { buscar: async () => ({ nombre: 'Gel', marca: 'CeraVe', fuente: 'A' }) };
    const conCategoria: CatalogoExterno = {
      buscar: async () => ({ nombre: 'Otro nombre', marca: 'Otra', categoria: 'limpiador', imagenUrl: 'https://x/y.jpg', fuente: 'B' }),
    };
    expect(await new CatalogoEnCadena([sinCategoria, conCategoria]).buscar(EAN)).toEqual({
      nombre: 'Gel',
      marca: 'CeraVe',
      categoria: 'limpiador',
      imagenUrl: 'https://x/y.jpg',
      fuente: 'A',
    });
  });

  it('no pregunta a más catálogos si la primera ficha ya está completa', async () => {
    const segundo = { buscar: jest.fn() };
    const completo: CatalogoExterno = { buscar: async () => ({ nombre: 'X', categoria: 'base', fuente: 'A' }) };
    await new CatalogoEnCadena([completo, segundo]).buscar(EAN);
    expect(segundo.buscar).not.toHaveBeenCalled();
  });
});

it('reintenta una vez los errores 5xx', async () => {
  globalThis.fetch = jest
    .fn()
    .mockResolvedValueOnce({ status: 500, ok: false, json: async () => ({}) })
    .mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ status: 1, product: { product_name: 'Gel', brands: 'CeraVe' } }),
    }) as unknown as typeof fetch;
  expect((await new OpenBeautyFacts().buscar(EAN))?.nombre).toBe('Gel');
  expect(globalThis.fetch).toHaveBeenCalledTimes(2);
});

describe('OpenBeautyFacts: nombres y categorías', () => {
  it('descarta un nombre en inglés de una sola palabra', async () => {
    responder(200, {
      status: 1,
      product: { brands: 'Nyx', product_name: 'NYX Lingerie XXL 05 Lippenstift', product_name_en: 'lipstick' },
    });
    expect((await new OpenBeautyFacts().buscar(EAN))?.nombre).toBe('Lingerie XXL 05 Lippenstift');
  });

  it('usa el inglés si no hay español y deduce la categoría del nombre', async () => {
    responder(200, {
      status: 1,
      product: { brands: 'CeraVe', product_name: 'Schuimende Reinigingsgel', product_name_en: 'Foaming Cleanser' },
    });
    expect(await new OpenBeautyFacts().buscar(EAN)).toMatchObject({ nombre: 'Foaming Cleanser', categoria: 'limpiador' });
  });
});
