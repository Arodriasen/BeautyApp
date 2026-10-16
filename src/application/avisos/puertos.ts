import type { AjustesAvisos, AvisoPlanificado } from './PlanificadorAvisos';

export type EstadoPermiso = 'concedido' | 'denegado' | 'preguntable';

/** Puerto hacia las notificaciones del sistema. */
export interface Notificador {
  permiso(): Promise<EstadoPermiso>;
  /** Muestra el diálogo del sistema. Devuelve si se ha concedido. */
  pedirPermiso(): Promise<boolean>;
  /** Sustituye todo lo programado por estos avisos. */
  programar(avisos: AvisoPlanificado[]): Promise<void>;
  /** Una notificación de prueba a los pocos segundos. */
  probar(): Promise<void>;
}

export interface AjustesRepositorio {
  obtenerAvisos(): Promise<AjustesAvisos>;
  guardarAvisos(ajustes: AjustesAvisos): Promise<void>;
}
