/**
 * Utilidades de fechas "de calendario" (sin hora). Todas las fechas del dominio
 * se normalizan a medianoche local para que las comparaciones sean por día.
 */

export function soloFecha(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

/** Suma meses respetando fin de mes: 31 ene + 1 mes = 28/29 feb. */
export function sumarMeses(fecha: Date, meses: number): Date {
  const base = soloFecha(fecha);
  const destino = new Date(base.getFullYear(), base.getMonth() + meses, 1);
  const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  destino.setDate(Math.min(base.getDate(), ultimoDia));
  return destino;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Días enteros de `desde` a `hasta` (negativo si `hasta` es anterior). */
export function diasEntre(desde: Date, hasta: Date): number {
  const a = soloFecha(desde);
  const b = soloFecha(hasta);
  // Math.round absorbe el desfase de una hora en los cambios de horario.
  return Math.round((b.getTime() - a.getTime()) / MS_POR_DIA);
}

export function sumarDias(fecha: Date, dias: number): Date {
  const base = soloFecha(fecha);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + dias);
}

/** El mismo día a la hora indicada (hora local). */
export function aLas(fecha: Date, hora: number, minuto = 0): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), hora, minuto);
}
