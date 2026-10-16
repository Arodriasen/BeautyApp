import { fecha, FotosEnMemoria, ProductosEnMemoria, UnidadesEnMemoria } from '@/test-utils/en-memoria';

import { ServicioNeceser } from '../ServicioNeceser';

const HOY = fecha('2026-10-16');

function crearServicio() {
  const productos = new ProductosEnMemoria();
  const unidades = new UnidadesEnMemoria();
  const fotos = new FotosEnMemoria();
  let n = 0;
  const servicio = new ServicioNeceser(productos, unidades, fotos, () => `id${++n}`);
  return { servicio, productos, unidades, fotos };
}

describe('ServicioNeceser', () => {
  it('da de alta un producto con su primer bote', async () => {
    const { servicio, unidades } = crearServicio();
    const id = await servicio.nuevoProducto({
      marca: 'Maybelline',
      nombre: 'Lash Sensational',
      categoria: 'mascara',
      fechaApertura: fecha('2026-09-01'),
    });

    const detalle = await servicio.detalle(id, HOY);
    expect(detalle?.producto.nombre).toBe('Lash Sensational');
    expect(detalle?.enUso).toHaveLength(1);
    expect(detalle?.enUso[0].estado).toMatchObject({ tipo: 'vigente', fechaLimite: fecha('2027-03-01') });
    expect(unidades.datos.size).toBe(1);
  });

  it('no guarda nada si los datos no son válidos', async () => {
    const { servicio, productos } = crearServicio();
    await expect(
      servicio.nuevoProducto({ marca: 'X', nombre: 'Y', categoria: 'otro', ean: '123' }),
    ).rejects.toThrow('Código de barras no válido');
    await expect(
      servicio.nuevoProducto({ marca: 'X', nombre: 'Y', categoria: 'otro', paoMeses: 0 }),
    ).rejects.toThrow('PAO');
    expect(productos.datos.size).toBe(0);
  });

  it('ordena el resumen por urgencia', async () => {
    const { servicio } = crearServicio();
    const sinAbrir = await servicio.nuevoProducto({ marca: 'A', nombre: 'Sin abrir', categoria: 'base' });
    const vigente = await servicio.nuevoProducto({
      marca: 'B', nombre: 'Vigente', categoria: 'base', fechaApertura: fecha('2026-10-01'),
    });
    const caducado = await servicio.nuevoProducto({
      marca: 'C', nombre: 'Caducado', categoria: 'mascara', fechaApertura: fecha('2026-01-01'),
    });
    const pronto = await servicio.nuevoProducto({
      marca: 'D', nombre: 'Pronto', categoria: 'serum', fechaApertura: fecha('2026-05-01'),
    });

    const resumen = await servicio.resumen(HOY);
    expect(resumen.map((r) => r.producto.id)).toEqual([caducado, pronto, vigente, sinAbrir]);
    expect(resumen.map((r) => r.estado.tipo)).toEqual(['caducado', 'caducaPronto', 'vigente', 'sinFecha']);
  });

  it('el estado del producto es el de su bote más urgente en uso', async () => {
    const { servicio } = crearServicio();
    const id = await servicio.nuevoProducto({
      marca: 'A', nombre: 'Labial', categoria: 'labial', fechaApertura: fecha('2025-01-01'),
    });
    await servicio.nuevoBote(id, { fechaApertura: fecha('2026-10-01') });

    let [r] = await servicio.resumen(HOY);
    expect(r).toMatchObject({ botesEnUso: 2, botesAbiertos: 2, estado: { tipo: 'caducado' } });

    const viejo = (await servicio.detalle(id, HOY))!.enUso[0].unidad;
    await servicio.terminarBote(viejo.id, HOY);

    [r] = await servicio.resumen(HOY);
    expect(r).toMatchObject({ botesEnUso: 1, estado: { tipo: 'vigente' } });

    const detalle = await servicio.detalle(id, HOY);
    expect(detalle?.terminados.map((u) => u.id)).toEqual([viejo.id]);
  });

  it('marca como terminado el producto sin botes en uso', async () => {
    const { servicio } = crearServicio();
    const id = await servicio.nuevoProducto({ marca: 'A', nombre: 'Crema', categoria: 'hidratante' });
    const [bote] = (await servicio.detalle(id, HOY))!.enUso;
    await servicio.abrirBote(bote.unidad.id, fecha('2026-10-10'));
    await servicio.terminarBote(bote.unidad.id, HOY);

    const [r] = await servicio.resumen(HOY);
    expect(r.estado.tipo).toBe('terminado');
  });

  it('al eliminar un producto se eliminan sus botes', async () => {
    const { servicio, productos, unidades } = crearServicio();
    const id = await servicio.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'otro' });
    await servicio.nuevoBote(id);
    await servicio.eliminarProducto(id);
    expect(productos.datos.size).toBe(0);
    expect(unidades.datos.size).toBe(0);
  });

  it('no deja dar de alta dos veces el mismo código de barras', async () => {
    const { servicio } = crearServicio();
    await servicio.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'otro', ean: '036000291452' });
    await expect(
      servicio.nuevoProducto({ marca: 'C', nombre: 'D', categoria: 'otro', ean: '0036000291452' }),
    ).rejects.toThrow('Ya tienes');
  });

  describe('fotos', () => {
    it('guarda la foto al dar de alta', async () => {
      const { servicio, fotos } = crearServicio();
      const id = await servicio.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'base', foto: 'file:///cache/tmp.jpg' });
      const { producto } = (await servicio.detalle(id, HOY))!;
      expect(producto.foto).toBeDefined();
      expect(fotos.guardadas.get(producto.foto!)).toBe('file:///cache/tmp.jpg');
    });

    it('si la foto no se puede guardar, da de alta igualmente sin foto', async () => {
      const { servicio } = crearServicio();
      const id = await servicio.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'base', foto: 'https://falla/x.jpg' });
      expect((await servicio.detalle(id, HOY))!.producto.foto).toBeUndefined();
    });

    it('no guarda la foto si los datos no son válidos', async () => {
      const { servicio, fotos } = crearServicio();
      await expect(servicio.nuevoProducto({ marca: ' ', nombre: 'B', categoria: 'base', foto: 'file:///x.jpg' })).rejects.toThrow();
      expect(fotos.guardadas.size).toBe(0);
    });

    it('al cambiar la foto se borra la anterior; también se puede quitar', async () => {
      const { servicio, fotos } = crearServicio();
      const id = await servicio.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'base', foto: 'file:///1.jpg' });
      await servicio.cambiarFoto(id, 'file:///2.jpg');
      expect([...fotos.guardadas.values()]).toEqual(['file:///2.jpg']);
      await servicio.cambiarFoto(id, undefined);
      expect(fotos.guardadas.size).toBe(0);
      expect((await servicio.detalle(id, HOY))!.producto.foto).toBeUndefined();
    });

    it('al eliminar el producto se borra su foto', async () => {
      const { servicio, fotos } = crearServicio();
      const id = await servicio.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'base', foto: 'file:///1.jpg' });
      await servicio.eliminarProducto(id);
      expect(fotos.guardadas.size).toBe(0);
    });
  });
});

describe('color del tono', () => {
  it('se guarda al dar de alta y se puede cambiar o quitar después', async () => {
    const { servicio } = crearServicio();
    const id = await servicio.nuevoProducto({
      marca: 'MAC', nombre: 'Matte Lipstick', tono: 'Ruby Woo', categoria: 'labial', colorTono: '#a3162d',
    });
    expect((await servicio.detalle(id, HOY))!.producto.colorTono).toBe('#A3162D');

    await servicio.cambiarColorTono(id, '#E07A95');
    expect((await servicio.detalle(id, HOY))!.producto.colorTono).toBe('#E07A95');

    await servicio.cambiarColorTono(id, undefined);
    expect((await servicio.detalle(id, HOY))!.producto).toMatchObject({ colorTono: undefined, tono: 'Ruby Woo' });
  });
});
