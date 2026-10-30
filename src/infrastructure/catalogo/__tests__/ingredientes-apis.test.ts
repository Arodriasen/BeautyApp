import { Ean } from '@/domain/productos/Ean';

import { InciApi } from '../InciApi';
import { ObfIngredientes } from '../ObfIngredientes';

const EAN = Ean.crear('3337875597197');

function responder(status: number, cuerpo: unknown) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => cuerpo,
  }) as unknown as typeof fetch;
}
const llamada = () => (globalThis.fetch as jest.Mock).mock.calls[0];

describe('ObfIngredientes', () => {
  it('convierte el texto de ingredientes en lista', async () => {
    responder(200, { status: 1, product: { ingredients_text: 'Aqua, Glycerin, Niacinamide, Ceramide NP' } });
    expect(await new ObfIngredientes().ingredientes(EAN)).toEqual(['Aqua', 'Glycerin', 'Niacinamide', 'Ceramide NP']);
  });

  it('usa el inglés si el principal está vacío y devuelve undefined si no hay nada', async () => {
    responder(200, { status: 1, product: { ingredients_text: '', ingredients_text_en: 'Aqua, Parfum' } });
    expect(await new ObfIngredientes().ingredientes(EAN)).toEqual(['Aqua', 'Parfum']);
    responder(200, { status: 1, product: {} });
    expect(await new ObfIngredientes().ingredientes(EAN)).toBeUndefined();
  });
});

describe('InciApi', () => {
  const RESPUESTA = {
    barcode: '3337875597197',
    overallSafetyScore: 7.3,
    safetyLevel: 'low_risk',
    pregnancySafe: true,
    parsedIngredients: [
      { inciName: 'AQUA', isAllergen: false },
      { inciName: 'LINALOOL', isAllergen: true },
    ],
    allergenFlags: [],
  };

  it('busca por código con la clave en la cabecera', async () => {
    responder(200, RESPUESTA);
    const r = await new InciApi().porCodigo(EAN, 'sk_live_x');
    expect(llamada()[0]).toBe('https://inciapi.com/v1/products/3337875597197/safety');
    expect(llamada()[1].headers['X-API-Key']).toBe('sk_live_x');
    expect(r).toMatchObject({
      ingredientes: ['AQUA', 'LINALOOL'],
      analisis: { puntuacion: 7.3, nivel: 'low_risk', alergenos: ['LINALOOL'], aptoEmbarazo: true },
    });
  });

  it('404 = no lo tiene', async () => {
    responder(404, { code: 'product_not_found' });
    expect(await new InciApi().porCodigo(EAN, 'k')).toBeUndefined();
  });

  it('analiza una lista con POST y acepta alérgenos como texto u objeto', async () => {
    responder(200, { analysis: { ...RESPUESTA, parsedIngredients: [], allergenFlags: ['Limonene', { inciName: 'Linalool' }] } });
    const a = await new InciApi().analizar(['Aqua', 'Limonene', 'Linalool'], 'k');
    expect(llamada()[1].method).toBe('POST');
    expect(JSON.parse(llamada()[1].body)).toEqual({ inci: ['Aqua', 'Limonene', 'Linalool'] });
    expect(a.alergenos).toEqual(['Limonene', 'Linalool']);
  });

  it.each([
    [401, { code: 'invalid_api_key' }, 'clave de INCI API no es válida'],
    [429, { code: 'quota_exhausted' }, 'agotado'],
    [429, { code: 'ip_rate_limit_exceeded' }, 'Demasiadas consultas'],
    [500, { code: 'boom' }, '500, boom'],
  ])('traduce el error %i', async (estado, cuerpo, mensaje) => {
    responder(estado, cuerpo);
    await expect(new InciApi().analizar(['Aqua'], 'k')).rejects.toThrow(mensaje);
  });
});
