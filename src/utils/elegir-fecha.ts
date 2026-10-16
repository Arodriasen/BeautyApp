import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

interface Opciones {
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
}

/** Abre el calendario nativo de Android. Resuelve `undefined` si se cancela. */
export function elegirFecha(inicial: Date, opciones: Opciones = {}): Promise<Date | undefined> {
  return new Promise((resolve) => {
    DateTimePickerAndroid.open({
      value: inicial,
      mode: 'date',
      ...opciones,
      onValueChange: (_evento, fecha) => resolve(fecha),
      onDismiss: () => resolve(undefined),
    });
  });
}

/** Abre el reloj nativo de Android (24 h). Resuelve `undefined` si se cancela. */
export function elegirHora(hora: number, minuto: number): Promise<{ hora: number; minuto: number } | undefined> {
  const inicial = new Date();
  inicial.setHours(hora, minuto, 0, 0);
  return new Promise((resolve) => {
    DateTimePickerAndroid.open({
      value: inicial,
      mode: 'time',
      is24Hour: true,
      onValueChange: (_evento, f) => resolve({ hora: f.getHours(), minuto: f.getMinutes() }),
      onDismiss: () => resolve(undefined),
    });
  });
}
