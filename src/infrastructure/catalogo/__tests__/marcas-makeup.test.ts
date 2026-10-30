import { MakeupApi } from '../MakeupApi';
import { nombreDeMarca, quitarMarcaDelNombre } from '../marcas';

describe('nombreDeMarca', () => {
  it.each([
    ['maybelline', 'Maybelline'],
    ['Maybelline New York', 'Maybelline'],
    ['MAYBELLINE', 'Maybelline'],
    ['NYX Professional Makeup', 'NYX'],
    ["L'OREAL NORGE AS", "L'Oréal Paris"],
    ["L'Oréal Paris", "L'Oréal Paris"],
    ['estee lauder', 'Estée Lauder'],
    ['penny lane organics', 'Penny Lane Organics'],
    ['MiMarca', 'MiMarca'],
    ['e.l.f.', 'e.l.f.'],
  ])('%s → %s', (entrada, salida) => {
    expect(nombreDeMarca(entrada)).toBe(salida);
  });
});

describe('quitarMarcaDelNombre', () => {
  it.each([
    ['Maybelline New York Lash Sensational', 'Maybelline', 'Lash Sensational'],
    ['NYX Professional Makeup Epic Wear', 'NYX', 'Epic Wear'],
    ['NYX Professional Makeup Epic Wear', 'NYX Professional Makeup', 'Epic Wear'],
    ['Maybelline - Fit Me', 'maybelline', 'Fit Me'],
    ['Maybellinea Algo', 'Maybelline', 'Maybellinea Algo'],
    ['Fit Me', 'Maybelline', 'Fit Me'],
    ['NYX', 'NYX', 'NYX'],
  ])('"%s" (marca %s) → "%s"', (nombre, marca, salida) => {
    expect(quitarMarcaDelNombre(nombre, marca)).toBe(salida);
  });
});

describe('MakeupApi', () => {
  const CATALOGO = [
    {
      brand: 'maybelline',
      name: 'Maybelline Fit Me Bronzer',
      product_type: 'bronzer',
      api_featured_image: '//s3.amazonaws.com/donovanbailey/x.png',
      product_colors: [
        { hex_value: '#cf9978', colour_name: 'Medium Bronze ' },
        { hex_value: 'gray7', colour_name: 'Gris' },
        { hex_value: '#F7E2D1,#673E2C', colour_name: 'Duo' },
      ],
    },
    { brand: 'nyx', name: 'Matte Lipstick', product_type: 'lipstick', product_colors: [] },
  ];

  function catalogo() {
    globalThis.fetch = jest.fn().mockResolvedValue({ status: 200, ok: true, json: async () => CATALOGO }) as unknown as typeof fetch;
  }

  it('descarga el catálogo una vez y busca dentro', async () => {
    catalogo();
    const api = new MakeupApi();
    const [r] = await api.buscarPorNombre('fit me');
    expect(r).toEqual({
      marca: 'Maybelline',
      nombre: 'Fit Me Bronzer',
      categoria: 'bronceador',
      imagenUrl: 'https://s3.amazonaws.com/donovanbailey/x.png',
      tonos: [
        { color: '#CF9978', nombre: 'Medium Bronze' },
        { color: '#F7E2D1', nombre: 'Duo' },
      ],
      fuente: 'Makeup API',
    });
    expect(await api.buscarPorNombre('nyx lipstick')).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  describe('buscarTonos (para lo escaneado)', () => {
    const tono = (hex: string) => [{ hex_value: hex, colour_name: hex }];
    const CON_TONOS = [
      { brand: 'maybelline', name: 'Lash Sensational Mascara', product_colors: tono('#000000') },
      { brand: 'maybelline', name: 'Color Sensational Lipstick', product_colors: tono('#AA0000') },
      { brand: 'maybelline', name: 'Color Sensational Made For All Lipstick', product_colors: tono('#BB0000') },
      { brand: 'nyx', name: 'Soft Matte Lip Cream', product_colors: tono('#CC0000') },
      { brand: 'nyx', name: 'NYX Soft Matte Lip Cream', product_colors: [...tono('#CC0000'), ...tono('#DD0000')] },
      { brand: 'maybelline', name: 'Maybelline Fit Me Bronzer', product_colors: tono('#EE0000') },
      { brand: 'maybelline', name: 'Maybelline Fit Me Blush', product_colors: tono('#FF0000') },
      { brand: 'loreal', name: 'Infallible Lipstick', product_colors: [] },
    ];
    const api = () => {
      globalThis.fetch = jest.fn().mockResolvedValue({ status: 200, ok: true, json: async () => CON_TONOS }) as unknown as typeof fetch;
      return new MakeupApi();
    };
    const colores = (t: { color: string }[] | undefined) => t?.map((x) => x.color);

    it('encuentra el producto aunque el nombre escaneado venga en español y con la marca', async () => {
      expect(colores(await api().buscarTonos('Maybelline New York', 'Máscara de pestañas Lash Sensational'))).toEqual(['#000000']);
    });

    it('se queda con el que más palabras coinciden', async () => {
      expect(colores(await api().buscarTonos('Maybelline', 'Barra de labios Color Sensational Made For All 385'))).toEqual(['#BB0000']);
    });

    it('el mismo producto repetido no es duda: el que más tonos trae', async () => {
      expect(colores(await api().buscarTonos('NYX Professional Makeup', 'Labial líquido Soft Matte Lip Cream'))).toEqual(['#CC0000', '#DD0000']);
    });

    it('exige también el tipo de producto, traducido si viene en español', async () => {
      const a = api();
      expect(colores(await a.buscarTonos('Maybelline', 'Colorete Fit Me 25 Pink'))).toEqual(['#FF0000']);
      expect(await a.buscarTonos('Maybelline', 'Fit Me Concealer')).toBeUndefined();
    });

    it('no da tonos de otra marca, de otro producto ni si duda', async () => {
      const a = api();
      expect(await a.buscarTonos("L'Oréal Paris", 'Lash Sensational')).toBeUndefined();
      expect(await a.buscarTonos('Maybelline', 'Sky High mascara')).toBeUndefined();
      expect(await a.buscarTonos('Maybelline', 'Sensational')).toBeUndefined();
    });
  });

  it('si la descarga falla, lo reintenta en la siguiente búsqueda', async () => {
    globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error('sin red')) as unknown as typeof fetch;
    const api = new MakeupApi();
    await expect(api.buscarPorNombre('fit me')).rejects.toThrow('sin red');
    catalogo();
    expect(await api.buscarPorNombre('fit me')).toHaveLength(1);
  });
});
