import * as Notifications from './expo-notifications-local';

import type { AvisoPlanificado } from '@/application/avisos/PlanificadorAvisos';
import type { EstadoPermiso, Notificador } from '@/application/avisos/puertos';

const CANAL = 'caducidad';

/** Cómo se muestran las notificaciones si llegan con la app abierta. */
export function configurarNotificaciones(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

let canalCreado: Promise<string | undefined> | undefined;

/**
 * Crea (una sola vez) el canal propio y devuelve su id, o `undefined` si no se ha podido.
 * En Expo Go 58.0.x `setNotificationChannelAsync` revienta en nativo (NullPointerException);
 * sin canal propio Android usa el canal por defecto de Expo y los avisos llegan igual,
 * así que el fallo no debe impedir programarlos.
 */
function asegurarCanal(): Promise<string | undefined> {
  canalCreado ??= Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Avisos de caducidad',
    importance: Notifications.AndroidImportance.DEFAULT,
  }).then(
    () => CANAL,
    () => undefined,
  );
  return canalCreado;
}

const conCanal = (channelId: string | undefined) => (channelId ? { channelId } : {});

export class ExpoNotificador implements Notificador {
  // Las reprogramaciones van en fila: dos a la vez se pisarían al cancelar y volver a crear.
  private cola: Promise<void> = Promise.resolve();

  async permiso(): Promise<EstadoPermiso> {
    const p = await Notifications.getPermissionsAsync();
    if (p.granted) return 'concedido';
    return p.canAskAgain ? 'preguntable' : 'denegado';
  }

  async pedirPermiso(): Promise<boolean> {
    await asegurarCanal();
    const p = await Notifications.requestPermissionsAsync();
    return p.granted;
  }

  programar(avisos: AvisoPlanificado[]): Promise<void> {
    const tarea = this.cola.then(async () => {
      const canal = await asegurarCanal();
      await Notifications.cancelAllScheduledNotificationsAsync();
      for (const aviso of avisos) {
        await Notifications.scheduleNotificationAsync({
          identifier: aviso.id,
          content: {
            title: aviso.titulo,
            body: aviso.cuerpo,
            data: aviso.productoId ? { productoId: aviso.productoId } : {},
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: aviso.fecha, ...conCanal(canal) },
        });
      }
    });
    // Un fallo no debe bloquear las siguientes reprogramaciones.
    this.cola = tarea.catch(() => {});
    return tarea;
  }

  async probar(): Promise<void> {
    const canal = await asegurarCanal();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Aviso de prueba', body: 'Así te avisará Tocador cuando algo vaya a caducar.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, ...conCanal(canal) },
    });
  }
}
