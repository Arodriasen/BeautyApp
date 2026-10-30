import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { TonoSugerido } from '@/application/CatalogoExterno';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  tonos: TonoSugerido[];
  /** Color elegido ahora mismo en el formulario. */
  elegido?: string;
  onElegir: (tono: TonoSugerido) => void;
}

/** Los tonos que tiene ese producto (de la base de datos), para elegir el suyo de un toque. */
export function TonosSugeridos({ tonos, elegido, onElegir }: Props) {
  const tema = useTheme();
  return (
    <View style={[styles.caja, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
      <ThemedText type="smallBold">¿Qué tono es el tuyo?</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {tonos.length} tonos de este producto. Al elegir uno se rellenan el tono y su color.
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
        {tonos.map((t, i) => {
          const activo = elegido?.toUpperCase() === t.color;
          return (
            <Pressable
              key={`${t.color}-${i}`}
              onPress={() => onElegir(t)}
              accessibilityLabel={t.nombre ?? t.color}
              accessibilityState={{ selected: activo }}
              style={styles.tono}>
              <View
                style={[
                  styles.muestra,
                  { backgroundColor: t.color, borderColor: activo ? tema.primary : tema.border, borderWidth: activo ? 3 : 1 },
                ]}>
                {activo && <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />}
              </View>
              <ThemedText
                type="small"
                numberOfLines={2}
                style={[styles.nombre, activo && { color: tema.primary, fontFamily: Fonts.semibold }]}>
                {t.nombre ?? ''}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    borderWidth: 1,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  fila: {
    gap: Spacing.three,
    paddingTop: Spacing.one,
  },
  tono: {
    width: 64,
    alignItems: 'center',
    gap: Spacing.one,
  },
  muestra: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
});
