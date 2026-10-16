import {
  CompraEnMemoria,
  fecha,
  FotosEnMemoria,
  ProductosEnMemoria,
  UnidadesEnMemoria,
} from '@/test-utils/en-memoria';

import { ServicioCompra } from '../ServicioCompra';
import { ServicioNeceser } from '../ServicioNeceser';

const HOY = fecha('2026-10-16');

function crear() {
  let n = 0;
  const id = () => `id${++n}`;
  const neceser = new ServicioNeceser(new ProductosEnMemoria(), new UnidadesEnMemoria(), new FotosEnMemoria(), id);
  const compra = new ServicioCompra(new CompraEnMemoria(), neceser, id);
  return { neceser, compra };
}

async function productoDe(neceser: ServicioNeceser, id: string) {
  return (await neceser.detalle(id, HOY))!.producto;
}

describe('ServicioCompra', () => {
  it('añade texto libre y productos del neceser, sin duplicar los pendientes', async () => {
    const { neceser, compra } = crear();
    const id = await neceser.nuevoProducto({ marca: 'NYX', nombre: 'Epic Wear', tono: 'Black', categoria: 'delineador' });
    const producto = await productoDe(neceser, id);

    await compra.anadirTexto('Algodones', fecha('2026-10-15'));
    await compra.anadirProducto(producto, HOY);
    await compra.anadirProducto(producto, HOY);

    const { pendientes } = await compra.lista(HOY);
    expect(pendientes.map((p) => p.articulo.descripcion)).toEqual(['Algodones', 'NYX · Epic Wear · Black']);
    expect(pendientes[1].producto?.id).toBe(id);
    expect(await compra.enLista(id)).toBe(true);
  });

  it('rechaza un texto vacío', async () => {
    await expect(crear().compra.anadirTexto('   ')).rejects.toThrow('Escribe');
  });

  it('marca como comprado, desmarca y vacía los comprados', async () => {
    const { compra } = crear();
    await compra.anadirTexto('Algodones');
    const [{ articulo }] = (await compra.lista(HOY)).pendientes;

    await compra.marcarComprado(articulo.id, true, HOY);
    let lista = await compra.lista(HOY);
    expect(lista.pendientes).toHaveLength(0);
    expect(lista.comprados[0].articulo.compradoEl).toEqual(HOY);

    await compra.marcarComprado(articulo.id, false);
    expect((await compra.lista(HOY)).pendientes).toHaveLength(1);

    await compra.marcarComprado(articulo.id, true, HOY);
    await compra.vaciarComprados();
    lista = await compra.lista(HOY);
    expect([...lista.pendientes, ...lista.comprados]).toHaveLength(0);
  });

  it('un producto comprado se puede volver a añadir', async () => {
    const { neceser, compra } = crear();
    const producto = await productoDe(neceser, await neceser.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'base' }));
    await compra.anadirProducto(producto);
    await compra.marcarComprado((await compra.lista(HOY)).pendientes[0].articulo.id, true);
    expect(await compra.enLista(producto.id)).toBe(false);
    await compra.anadirProducto(producto);
    expect((await compra.lista(HOY)).pendientes).toHaveLength(1);
  });

  it('sugiere lo caducado, lo que caduca pronto y lo terminado que no esté ya en la lista', async () => {
    const { neceser, compra } = crear();
    const caducado = await neceser.nuevoProducto({
      marca: 'A', nombre: 'Máscara', categoria: 'mascara', fechaApertura: fecha('2026-01-01'),
    });
    const pronto = await neceser.nuevoProducto({
      marca: 'B', nombre: 'Sérum', categoria: 'serum', fechaApertura: fecha('2026-05-01'),
    });
    const terminado = await neceser.nuevoProducto({ marca: 'C', nombre: 'Crema', categoria: 'hidratante' });
    const bote = (await neceser.detalle(terminado, HOY))!.enUso[0].unidad;
    await neceser.terminarBote(bote.id, HOY);
    await neceser.nuevoProducto({ marca: 'D', nombre: 'Vigente', categoria: 'base', fechaApertura: fecha('2026-10-01') });

    let { sugerencias } = await compra.lista(HOY);
    expect(sugerencias.map((s) => [s.producto.id, s.motivo])).toEqual([
      [caducado, 'caducado'],
      [pronto, 'caducaPronto'],
      [terminado, 'terminado'],
    ]);

    await compra.anadirProducto(await productoDe(neceser, pronto));
    ({ sugerencias } = await compra.lista(HOY));
    expect(sugerencias.map((s) => s.producto.id)).toEqual([caducado, terminado]);
  });

  it('si se borra el producto, el artículo sigue en la lista con su descripción', async () => {
    const { neceser, compra } = crear();
    const id = await neceser.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'base' });
    await compra.anadirProducto(await productoDe(neceser, id));
    await neceser.eliminarProducto(id);
    const [p] = (await compra.lista(HOY)).pendientes;
    expect(p.articulo.descripcion).toBe('A · B');
    expect(p.producto).toBeUndefined();
  });
});
