import { Ean } from '@/domain/productos/Ean';
import { Producto } from '@/domain/productos/Producto';
import { ProductosEnMemoria } from '@/test-utils/en-memoria';

import type { CatalogoExterno } from '../CatalogoExterno';
import { ServicioEscaneo } from '../ServicioEscaneo';

const CODIGO = '0800897197148';

function crear(catalogo: CatalogoExterno) {
  const productos = new ProductosEnMemoria();
  return { productos, escaneo: new ServicioEscaneo(productos, catalogo) };
}

const catalogoQueNoSabe: CatalogoExterno = { buscar: async () => undefined };

describe('ServicioEscaneo', () => {
  it('descarta lecturas con dígito de control erróneo', async () => {
    const { escaneo } = crear(catalogoQueNoSabe);
    expect(await escaneo.identificar('0800897197149')).toEqual({ tipo: 'invalido' });
  });

  it('reconoce un producto que ya está en el neceser sin consultar internet', async () => {
    const buscar = jest.fn();
    const { escaneo, productos } = crear({ buscar });
    await productos.guardar(
      new Producto({ id: 'p1', marca: 'NYX', nombre: 'Epic Wear', categoria: 'delineador', ean: Ean.crear(CODIGO) }),
    );
    expect(await escaneo.identificar(CODIGO)).toEqual({ tipo: 'existente', productoId: 'p1' });
    expect(buscar).not.toHaveBeenCalled();
  });

  it('devuelve la ficha externa de un producto nuevo', async () => {
    const { escaneo } = crear({ buscar: async () => ({ marca: 'NYX', nombre: 'Epic Wear', fuente: 'Prueba' }) });
    expect(await escaneo.identificar(CODIGO)).toMatchObject({
      tipo: 'nuevo',
      ficha: { marca: 'NYX' },
      sinConexion: false,
    });
  });

  it('sin conexión sigue adelante con el código', async () => {
    const { escaneo } = crear({
      buscar: async () => {
        throw new Error('Network request failed');
      },
    });
    const r = await escaneo.identificar(CODIGO);
    expect(r).toMatchObject({ tipo: 'nuevo', sinConexion: true });
    expect(r.tipo === 'nuevo' && r.ean.valor).toBe(CODIGO);
  });
});
