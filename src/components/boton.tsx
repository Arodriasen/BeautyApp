import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variante = 'primario' | 'secundario' | 'peligro';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  deshabilitado?: boolean;
}

export function Boton({ titulo, onPress, variante = 'primario', deshabilitado }: Props) {
  const tema = useTheme();
  const fondo = variante === 'primario' ? tema.primary : 'transparent';
  const texto = variante === 'primario' ? tema.onPrimary : variante === 'peligro' ? tema.danger : tema.primary;
  const borde = variante === 'primario' ? tema.primary : variante === 'peligro' ? tema.danger : tema.border;

  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: fondo, borderColor: borde, opacity: deshabilitado ? 0.5 : pressed ? 0.7 : 1 },
      ]}>
      <Text style={[styles.texto, { color: texto }]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    borderWidth: 1,
    borderRadius: Radius.pastilla,
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  texto: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
