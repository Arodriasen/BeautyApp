import { Ean } from '@/domain/productos/Ean';
import { Producto } from '@/domain/productos/Producto';
import { ProductosEnMemoria } from '@/test-utils/en-memoria';

import type { AjustesIngredientes, AnalizadorIngredientes, FuenteIngredientes } from '../puertos';
import { ServicioIngredientes } from '../ServicioIngredientes';

const ANALISIS = { puntuacion: 7.3, nivel: 'low_risk' as const, alergenos: ['Linalool'], aptoEmbarazo: true, fecha: new Date(2026, 9, 16) };

function crear(opciones: { clave?: string; fuente?: FuenteIngredientes; analizador?: Partial<AnalizadorIngredientes> } = {}) {
  const productos = new ProductosEnMemoria();
  let ajustes: AjustesIngredientes = { evitar: [], claveInci: opciones.clave };
  const analizador: AnalizadorIngredientes = {
    porCodigo: jest.fn(async () => undefined),
    analizar: jest.fn(async () => ANALISIS),
    ...opciones.analizador,
  };
  const servicio = new ServicioIngredientes(
    productos,
    { obtenerIngredientes: async () => ajustes, guardarIngredientes: async (a) => void (ajustes = a) },
    opciones.fuente ?? { ingredientes: async () => undefined },
    analizador,
  );
  return { servicio, productos, analizador, ajustes: () => ajustes };
}

async function conProducto(productos: ProductosEnMemoria, ean?: string) {
  await productos.guardar(
    new Producto({ id: 'p', marca: 'CeraVe', nombre: 'Gel', categoria: 'limpiador', ean: ean ? Ean.crear(ean) : undefined }),
  );
}

describe('ServicioIngredientes', () => {
  it('guarda la lista pegada y un texto vacío la borra', async () => {
    const { servicio, productos } = crear();
    await conProducto(productos);
    await servicio.guardarLista('p', 'Aqua, Glycerin, Parfum');
    expect((await productos.obtener('p'))!.ingredientes).toEqual(['Aqua', 'Glycerin', 'Parfum']);
    await servicio.guardarLista('p', '   ');
    expect((await productos.obtener('p'))!.ingredientes).toBeUndefined();
  });

  it('busca primero en la fuente gratuita', async () => {
    const { servicio, productos, analizador } = crear({
      clave: 'k',
      fuente: { ingredientes: async () => ['Aqua', 'Niacinamide'] },
    });
    await conProducto(productos, '3337875597197');
    expect(await servicio.buscarLista('p')).toBe('encontrados');
    expect((await productos.obtener('p'))!.ingredientes).toEqual(['Aqua', 'Niacinamide']);
    expect(analizador.porCodigo).not.toHaveBeenCalled();
  });

  it('si la fuente gratuita no lo tiene y hay clave, prueba INCI API (lista y análisis)', async () => {
    const { servicio, productos } = crear({
      clave: 'k',
      analizador: { porCodigo: async () => ({ ingredientes: ['Aqua', 'Linalool'], analisis: ANALISIS }) },
    });
    await conProducto(productos, '3337875597197');
    expect(await servicio.buscarLista('p')).toBe('encontrados');
    expect((await productos.obtener('p'))!).toMatchObject({ ingredientes: ['Aqua', 'Linalool'], analisis: { puntuacion: 7.3 } });
  });

  it('sin código de barras no puede buscar; sin clave no consulta INCI API', async () => {
    const sinCodigo = crear({ clave: 'k' });
    await conProducto(sinCodigo.productos);
    expect(await sinCodigo.servicio.buscarLista('p')).toBe('sinCodigo');

    const sinClave = crear();
    await conProducto(sinClave.productos, '3337875597197');
    expect(await sinClave.servicio.buscarLista('p')).toBe('noEncontrados');
    expect(sinClave.analizador.porCodigo).not.toHaveBeenCalled();
  });

  it('analiza la lista guardada y exige clave y lista', async () => {
    const { servicio, productos } = crear({ clave: 'k' });
    await conProducto(productos);
    await expect(servicio.analizar('p')).rejects.toThrow('lista de ingredientes');
    await servicio.guardarLista('p', 'Aqua, Linalool');
    await servicio.analizar('p');
    expect((await productos.obtener('p'))!.analisis?.alergenos).toEqual(['Linalool']);

    const sinClave = crear();
    await conProducto(sinClave.productos);
    await expect(sinClave.servicio.analizar('p')).rejects.toThrow('clave de INCI API');
  });

  it('guarda los ajustes limpios: sin duplicados ni términos vacíos', async () => {
    const { servicio, ajustes } = crear();
    await servicio.guardarAjustes({ evitar: [' Perfume ', 'perfume', '', 'Paraben'], claveInci: '  ' });
    expect(ajustes()).toEqual({ evitar: ['Perfume', 'Paraben'], claveInci: undefined });
  });
});
