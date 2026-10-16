/**
 * Solo la parte de expo-notifications que usamos (notificaciones LOCALES), importada
 * pieza a pieza en lugar de `import ... from 'expo-notifications'`.
 *
 * Por qué: el `index` del paquete (58.1.x) carga siempre `TopicSubscriptionModule`, que es
 * de notificaciones push y no existe en Expo Go para Android (allí no hay push desde el
 * SDK 53). Resultado: "Cannot find native module 'ExpoTopicSubscriptionModule'" nada más
 * arrancar, aunque no se use. Importando por partes ese módulo nunca se carga.
 *
 * Cuando la app se ejecute como build propia (no Expo Go) esto podría volver a ser un
 * import normal, pero tampoco molesta.
 */
export { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
export { clearLastNotificationResponse } from 'expo-notifications/build/NotificationsEmitter';
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { useLastNotificationResponse } from 'expo-notifications/build/useLastNotificationResponse';
