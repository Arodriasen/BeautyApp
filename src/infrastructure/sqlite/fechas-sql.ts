/** Las fechas se guardan como texto 'AAAA-MM-DD' (fecha de calendario, sin zona horaria). */

export function aSql(fecha: Date | undefined): string | null {
  if (!fecha) return null;
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

export function deSql(texto: string | null): Date | undefined {
  if (!texto) return undefined;
  const [y, m, d] = texto.split('-').map(Number);
  return new Date(y, m - 1, d);
}
