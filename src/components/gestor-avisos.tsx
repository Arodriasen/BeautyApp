import * as Notifications from '@/infrastructure/notificaciones/expo-notifications-local';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useAvisos } from '@/hooks/use-neceser';

/**
 * Sin interfaz. Al arrancar pide permiso de notificaciones (solo la primera vez) y
 * reprograma los avisos; los vuelve a reprogramar cada vez que la app pasa a primer
 * plano (por si ha cambiado el día). Al pulsar un aviso de un producto, abre su ficha.
 */
export function GestorAvisos() {
  const avisos = useAvisos();
  const navegacionLista = !!useRootNavigationState()?.key;
  const respuesta = Notifications.useLastNotificationResponse();
  const atendida = useRef<string | null>(null);

  useEffect(() => {
    avisos
      .pedirPermisoSiNoSeHaPreguntado()
      .then(() => avisos.sincronizar())
      .catch(() => {});
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') avisos.sincronizar().catch(() => {});
    });
    return () => sub.remove();
  }, [avisos]);

  useEffect(() => {
    if (!navegacionLista || !respuesta) return;
    const id = respuesta.notification.request.identifier;
    if (atendida.current === id) return;
    atendida.current = id;
    Notifications.clearLastNotificationResponse();

    const productoId = respuesta.notification.request.content.data?.productoId;
    if (typeof productoId === 'string') {
      router.push({ pathname: '/producto/[id]', params: { id: productoId } });
    }
  }, [navegacionLista, respuesta]);

  return null;
}
