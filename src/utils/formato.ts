import type { EstadoProducto } from '@/application/ServicioNeceser';
import type { ThemeColor } from '@/constants/theme';

export function formatearFecha(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${fecha.getFullYear()}`;
}

const dias = (n: number) => (n === 1 ? '1 día' : `${n} días`);

/** Texto corto del estado. `abierto` distingue "sin abrir" de "abierto pero sin fecha". */
export function describirEstado(estado: EstadoProducto, abierto: boolean): string {
  switch (estado.tipo) {
    case 'caducado':
      return `Caducado hace ${dias(-estado.diasRestantes)}`;
    case 'caducaPronto':
      if (estado.diasRestantes === 0) return 'Caduca hoy';
      if (estado.diasRestantes === 1) return 'Caduca mañana';
      return `Caduca en ${dias(estado.diasRestantes)}`;
    case 'vigente':
      return `Hasta el ${formatearFecha(estado.fechaLimite)}`;
    case 'sinFecha':
      return abierto ? 'Sin fecha de caducidad' : 'Sin abrir';
    case 'terminado':
      return 'Terminado';
    case 'sinBotes':
      return 'Sin botes';
  }
}

export function colorEstado(estado: EstadoProducto): ThemeColor {
  switch (estado.tipo) {
    case 'caducado':
      return 'caducado';
    case 'caducaPronto':
      return 'caducaPronto';
    case 'vigente':
      return 'vigente';
    default:
      return 'neutro';
  }
}
