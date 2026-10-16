import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { GRUPOS_TONOS, nombreDeColor } from '@/constants/tonos';
import { useTheme } from '@/hooks/use-theme';

const TAMANO = 34;

/** Los claros llevan la marca de elegido en oscuro para que se vea. */
function esClaro(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

interface Props {
  valor: string | undefined;
  /** Tocar el color elegido lo quita. */
  onCambio: (color: string | undefined) => void;
}

export function SelectorColorTono({ valor, onCambio }: Props) {
  const tema = useTheme();
  const elegido = valor?.toUpperCase();

  return (
    <View style={styles.contenedor}>
      {GRUPOS_TONOS.map(({ grupo, tonos }) => (
        <View key={grupo} style={styles.grupo}>
          <ThemedText type="small" themeColor="textSecondary">
            {grupo}
          </ThemedText>
          <View style={styles.colores}>
            {tonos.map(({ nombre, color }) => {
              const activo = color === elegido;
              return (
                <Pressable
                  key={color}
                  onPress={() => onCambio(activo ? undefined : color)}
                  accessibilityRole="button"
                  accessibilityLabel={nombre}
                  accessibilityState={{ selected: activo }}
                  hitSlop={4}
                  style={[
                    styles.color,
                    { backgroundColor: color, borderColor: activo ? tema.primary : tema.border },
                    activo && styles.activo,
                  ]}>
                  {activo && (
                    <MaterialCommunityIcons name="check" size={18} color={esClaro(color) ? tema.text : '#FFFFFF'} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {elegido && (
        <ThemedText type="small" themeColor="textSecondary">
          Elegido: {nombreDeColor(elegido) ?? elegido} · tócalo otra vez para quitarlo
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: Spacing.three,
  },
  grupo: {
    gap: Spacing.two,
  },
  colores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two + Spacing.one,
  },
  color: {
    width: TAMANO,
    height: TAMANO,
    borderRadius: TAMANO / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activo: {
    borderWidth: 3,
  },
});
