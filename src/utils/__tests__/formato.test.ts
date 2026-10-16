import { describirEstado, formatearFecha } from '../formato';

const limite = new Date(2026, 10, 1);

describe('describirEstado', () => {
  it.each([
    [{ tipo: 'caducado', fechaLimite: limite, diasRestantes: -1 }, 'Caducado hace 1 día'],
    [{ tipo: 'caducado', fechaLimite: limite, diasRestantes: -12 }, 'Caducado hace 12 días'],
    [{ tipo: 'caducaPronto', fechaLimite: limite, diasRestantes: 0 }, 'Caduca hoy'],
    [{ tipo: 'caducaPronto', fechaLimite: limite, diasRestantes: 1 }, 'Caduca mañana'],
    [{ tipo: 'caducaPronto', fechaLimite: limite, diasRestantes: 16 }, 'Caduca en 16 días'],
    [{ tipo: 'vigente', fechaLimite: limite, diasRestantes: 90 }, 'Hasta el 01/11/2026'],
    [{ tipo: 'terminado' }, 'Terminado'],
  ] as const)('%o → %s', (estado, texto) => {
    expect(describirEstado(estado, true)).toBe(texto);
  });

  it('distingue sin abrir de abierto sin fecha', () => {
    expect(describirEstado({ tipo: 'sinFecha' }, false)).toBe('Sin abrir');
    expect(describirEstado({ tipo: 'sinFecha' }, true)).toBe('Sin fecha de caducidad');
  });
});

it('formatea fechas como dd/mm/aaaa', () => {
  expect(formatearFecha(new Date(2026, 0, 5))).toBe('05/01/2026');
});
