import { Unidad } from '../inventario/Unidad';
import { Ean } from '../productos/Ean';
import { Pao } from '../productos/Pao';
import { ingredientesEvitados, parsearListaInci } from '../productos/Ingredientes';
import { Producto } from '../productos/Producto';
import { diasEntre, sumarMeses } from '../shared/fechas';

const fecha = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

describe('fechas', () => {
  it('suma meses ajustando al fin de mes', () => {
    expect(sumarMeses(fecha('2026-01-31'), 1)).toEqual(fecha('2026-02-28'));
    expect(sumarMeses(fecha('2028-01-31'), 1)).toEqual(fecha('2028-02-29'));
    expect(sumarMeses(fecha('2026-10-16'), 12)).toEqual(fecha('2027-10-16'));
  });

  it('cuenta días aunque haya cambio de horario por medio', () => {
    expect(diasEntre(fecha('2026-10-20'), fecha('2026-10-30'))).toBe(10);
    expect(diasEntre(fecha('2026-03-25'), fecha('2026-04-01'))).toBe(7);
  });
});

describe('Ean', () => {
  it.each(['8410000000009', '3600523614370', '96385074', '036000291452'])('acepta %s', (c) => {
    expect(Ean.esValido(c)).toBe(true);
  });

  it.each(['8410000000004', '12345', 'abcdefghijklm', ''])('rechaza %s', (c) => {
    expect(Ean.esValido(c)).toBe(false);
  });

  it('ignora espacios', () => {
    expect(Ean.crear(' 3600523 614370 ').valor).toBe('3600523614370');
  });

  it('normaliza UPC-A a EAN-13', () => {
    expect(Ean.crear('036000291452').valor).toBe('0036000291452');
    expect(Ean.crear('036000291452').equals(Ean.crear('0036000291452'))).toBe(true);
  });

  it('intentar no lanza con códigos inválidos', () => {
    expect(Ean.intentar('123')).toBeUndefined();
    expect(Ean.intentar('96385074')?.valor).toBe('96385074');
  });
});

describe('Pao', () => {
  it('lee el texto del envase', () => {
    expect(Pao.desdeTexto('12M').meses).toBe(12);
    expect(Pao.desdeTexto('6 m').meses).toBe(6);
  });

  it('rechaza valores fuera de rango', () => {
    expect(() => Pao.crear(0)).toThrow();
    expect(() => Pao.crear(61)).toThrow();
    expect(() => Pao.desdeTexto('doce')).toThrow();
  });
});

describe('Producto', () => {
  it('usa el PAO habitual de la categoría si no tiene uno propio', () => {
    const mascara = new Producto({ id: 'p1', marca: 'Marca', nombre: 'Volumen', categoria: 'mascara' });
    expect(mascara.paoEfectivo?.meses).toBe(6);

    const conPao = new Producto({ ...mascara, pao: Pao.crear(3) });
    expect(conPao.paoEfectivo?.meses).toBe(3);

    const brocha = new Producto({ id: 'p2', marca: 'Marca', nombre: 'Brocha', categoria: 'accesorio' });
    expect(brocha.paoEfectivo).toBeUndefined();
  });

  it('exige marca y nombre', () => {
    expect(() => new Producto({ id: 'p', marca: ' ', nombre: 'x', categoria: 'otro' })).toThrow();
  });
});

describe('Unidad', () => {
  const pao6 = Pao.crear(6);

  it('sin abrir y sin caducidad impresa no tiene fecha', () => {
    const u = new Unidad({ id: 'u', productoId: 'p' });
    expect(u.estado(pao6, fecha('2026-10-16'))).toEqual({ tipo: 'sinFecha' });
  });

  it('calcula la fecha límite como apertura + PAO', () => {
    const u = new Unidad({ id: 'u', productoId: 'p', fechaApertura: fecha('2026-05-01') });
    expect(u.fechaLimite(pao6)).toEqual(fecha('2026-11-01'));
  });

  it('se queda con la fecha más temprana entre PAO y fabricante', () => {
    const u = new Unidad({
      id: 'u',
      productoId: 'p',
      fechaApertura: fecha('2026-05-01'),
      caducidadFabricante: fecha('2026-08-15'),
    });
    expect(u.fechaLimite(pao6)).toEqual(fecha('2026-08-15'));
  });

  it('pasa por vigente, caduca pronto y caducado', () => {
    const u = new Unidad({ id: 'u', productoId: 'p', fechaApertura: fecha('2026-05-01') });
    expect(u.estado(pao6, fecha('2026-09-01')).tipo).toBe('vigente');
    expect(u.estado(pao6, fecha('2026-10-16'))).toMatchObject({ tipo: 'caducaPronto', diasRestantes: 16 });
    expect(u.estado(pao6, fecha('2026-11-01')).tipo).toBe('caducaPronto');
    expect(u.estado(pao6, fecha('2026-11-02'))).toMatchObject({ tipo: 'caducado', diasRestantes: -1 });
  });

  it('no se puede abrir dos veces', () => {
    const u = new Unidad({ id: 'u', productoId: 'p' });
    u.abrir(fecha('2026-10-16'));
    expect(u.abierta).toBe(true);
    expect(() => u.abrir(fecha('2026-10-17'))).toThrow();
  });
});

describe('Producto: color del tono', () => {
  const base = { id: 'p', marca: 'MAC', nombre: 'Matte Lipstick', categoria: 'labial' as const };

  it('guarda el color normalizado en mayúsculas', () => {
    expect(new Producto({ ...base, colorTono: '#a3162d' }).colorTono).toBe('#A3162D');
  });

  it('rechaza colores mal escritos', () => {
    expect(() => new Producto({ ...base, colorTono: 'rojo' })).toThrow('Color no válido');
    expect(() => new Producto({ ...base, colorTono: '#FFF' })).toThrow('Color no válido');
  });

  it('se puede cambiar o quitar sin perder el resto', () => {
    const p = new Producto({ ...base, tono: 'Ruby Woo', foto: 'f.jpg' }).conColorTono('#A3162D');
    expect(p).toMatchObject({ tono: 'Ruby Woo', foto: 'f.jpg', colorTono: '#A3162D' });
    expect(p.conColorTono(undefined).colorTono).toBeUndefined();
  });
});

describe('Ingredientes', () => {
  it('lee la lista de la caja', () => {
    expect(
      // El punto final se quita ("Alcohol Denat." → "Alcohol Denat"); no separa ingredientes.
      parsearListaInci('Ingredients: Aqua, Glycerin; Parfum (Fragrance, Aroma)\n• Linalool, Alcohol Denat.\nAqua.'),
    ).toEqual(['Aqua', 'Glycerin', 'Parfum (Fragrance, Aroma)', 'Linalool', 'Alcohol Denat']);
  });

  it('detecta los ingredientes a evitar por fragmento y sin tildes', () => {
    const lista = ['Aqua', 'Methylparaben', 'Propylparaben', 'Alcohol Denat.', 'Parfum'];
    expect(ingredientesEvitados(lista, ['paraben', 'ALCOHOL'])).toEqual(['Methylparaben', 'Propylparaben', 'Alcohol Denat.']);
    expect(ingredientesEvitados(lista, ['  '])).toEqual([]);
  });

  it('cambiar la lista borra el análisis anterior', () => {
    const p = new Producto({ id: 'p', marca: 'A', nombre: 'B', categoria: 'serum', ingredientes: ['Aqua'] }).conAnalisis({
      puntuacion: 8,
      alergenos: [],
      fecha: new Date(2026, 9, 16),
    });
    expect(p.analisis?.puntuacion).toBe(8);
    expect(p.conIngredientes(['Aqua', 'Retinol']).analisis).toBeUndefined();
  });
});
