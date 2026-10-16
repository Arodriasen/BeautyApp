import { ServicioNeceser } from '@/application/ServicioNeceser';
import {
  AjustesEnMemoria,
  fecha,
  FotosEnMemoria,
  NotificadorFalso,
  ProductosEnMemoria,
  UnidadesEnMemoria,
} from '@/test-utils/en-memoria';

import { AJUSTES_POR_DEFECTO } from '../PlanificadorAvisos';
import { ServicioAvisos } from '../ServicioAvisos';

const AHORA = new Date(2026, 9, 16, 12, 0);

function crear(notificador = new NotificadorFalso()) {
  const productos = new ProductosEnMemoria();
  const unidades = new UnidadesEnMemoria();
  const ajustes = new AjustesEnMemoria();
  const avisos = new ServicioAvisos(productos, unidades, ajustes, notificador);
  const cambios = jest.fn();
  let n = 0;
  const neceser = new ServicioNeceser(productos, unidades, new FotosEnMemoria(), () => `id${++n}`, cambios);
  return { avisos, neceser, notificador, ajustes, cambios };
}

describe('ServicioAvisos', () => {
  it('programa los avisos de los botes en uso y no los de los terminados', async () => {
    const { avisos, neceser, notificador } = crear();
    const id = await neceser.nuevoProducto({
      marca: 'A', nombre: 'Máscara', categoria: 'mascara', fechaApertura: fecha('2026-09-01'),
    });
    await avisos.sincronizar(AHORA);
    expect(notificador.programados.map((a) => a.titulo)).toEqual(['Caduca en 7 días', 'Hoy caduca']);

    const bote = (await neceser.detalle(id, AHORA))!.enUso[0].unidad;
    await neceser.terminarBote(bote.id, AHORA);
    await avisos.sincronizar(AHORA);
    expect(notificador.programados).toEqual([]);
  });

  it('el neceser avisa de cada cambio en los botes', async () => {
    const { neceser, cambios } = crear();
    const id = await neceser.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'base' });
    const bote = (await neceser.detalle(id, AHORA))!.enUso[0].unidad;
    await neceser.abrirBote(bote.id, AHORA);
    await neceser.terminarBote(bote.id, AHORA);
    await neceser.eliminarProducto(id);
    expect(cambios).toHaveBeenCalledTimes(4);
  });

  it('sin permiso no programa nada', async () => {
    const { avisos, neceser, notificador } = crear(new NotificadorFalso('denegado'));
    await neceser.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'mascara', fechaApertura: fecha('2026-09-01') });
    notificador.programados = [{ id: 'viejo', fecha: AHORA, titulo: '', cuerpo: '' }];
    await avisos.sincronizar(AHORA);
    expect(notificador.programados.map((a) => a.id)).toEqual(['viejo']);
  });

  it('al activar pide permiso; si lo niega, quedan desactivados', async () => {
    const { avisos, ajustes } = crear(new NotificadorFalso('preguntable', false));
    const concedido = await avisos.guardarAjustes({ ...AJUSTES_POR_DEFECTO, activados: true, diasAntes: 3 });
    expect(concedido).toBe(false);
    expect(ajustes.avisos).toMatchObject({ activados: false, diasAntes: 3 });
  });

  it('al desactivar cancela lo programado', async () => {
    const { avisos, neceser, notificador } = crear();
    await neceser.nuevoProducto({ marca: 'A', nombre: 'B', categoria: 'mascara', fechaApertura: fecha('2026-09-01') });
    await avisos.sincronizar(AHORA);
    expect(notificador.programados.length).toBeGreaterThan(0);
    await avisos.guardarAjustes({ ...AJUSTES_POR_DEFECTO, activados: false });
    expect(notificador.programados).toEqual([]);
  });

  it('pide permiso la primera vez solo si no se ha preguntado', async () => {
    const preguntable = new NotificadorFalso('preguntable');
    await crear(preguntable).avisos.pedirPermisoSiNoSeHaPreguntado();
    expect(preguntable.estado).toBe('concedido');

    const denegado = new NotificadorFalso('denegado');
    const espia = jest.spyOn(denegado, 'pedirPermiso');
    await crear(denegado).avisos.pedirPermisoSiNoSeHaPreguntado();
    expect(espia).not.toHaveBeenCalled();
  });
});
