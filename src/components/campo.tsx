import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { elegirFecha } from '@/utils/elegir-fecha';
import { formatearFecha } from '@/utils/formato';

export function Campo({ etiqueta, ...props }: TextInputProps & { etiqueta: string }) {
  const tema = useTheme();
  return (
    <View style={styles.campo}>
      <ThemedText type="smallBold">{etiqueta}</ThemedText>
      <TextInput
        placeholderTextColor={tema.textSecondary}
        {...props}
        style={[styles.entrada, { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement }]}
      />
    </View>
  );
}

interface CampoFechaProps {
  etiqueta: string;
  valor: Date | undefined;
  onCambio: (fecha: Date | undefined) => void;
  /** Si es false no se puede dejar vacío. */
  opcional?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function CampoFecha({ etiqueta, valor, onCambio, opcional = true, minimumDate, maximumDate }: CampoFechaProps) {
  const tema = useTheme();

  async function abrir() {
    const fecha = await elegirFecha(valor ?? new Date(), { minimumDate, maximumDate, title: etiqueta });
    if (fecha) onCambio(fecha);
  }

  return (
    <View style={styles.campo}>
      <ThemedText type="smallBold">{etiqueta}</ThemedText>
      <View style={styles.fila}>
        <Pressable
          onPress={abrir}
          style={[styles.entrada, styles.flex, { borderColor: tema.border, backgroundColor: tema.backgroundElement }]}>
          <ThemedText themeColor={valor ? 'text' : 'textSecondary'}>
            {valor ? formatearFecha(valor) : 'Sin fecha'}
          </ThemedText>
        </Pressable>
        {opcional && valor && (
          <Pressable onPress={() => onCambio(undefined)} hitSlop={8} accessibilityLabel="Quitar fecha">
            <ThemedText themeColor="textSecondary" style={styles.quitar}>
              ✕
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: Spacing.one,
  },
  entrada: {
    borderWidth: 1,
    borderRadius: Radius.campo,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  quitar: {
    fontSize: 20,
    paddingHorizontal: Spacing.two,
  },
});
