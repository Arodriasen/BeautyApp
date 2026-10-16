import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { CATEGORIAS, type Categoria, type Familia } from '@/domain/productos/Categoria';
import { useTheme } from '@/hooks/use-theme';

const FAMILIAS: { familia: Familia; titulo: string }[] = [
  { familia: 'maquillaje', titulo: 'Maquillaje' },
  { familia: 'cuidado', titulo: 'Cuidado' },
  { familia: 'otros', titulo: 'Otros' },
];

const ENTRADAS = Object.entries(CATEGORIAS) as [Categoria, (typeof CATEGORIAS)[Categoria]][];

interface Props {
  valor: Categoria | undefined;
  onCambio: (categoria: Categoria) => void;
}

export function SelectorCategoria({ valor, onCambio }: Props) {
  const tema = useTheme();
  return (
    <View style={styles.contenedor}>
      {FAMILIAS.map(({ familia, titulo }) => (
        <View key={familia} style={styles.grupo}>
          <ThemedText type="small" themeColor="textSecondary">
            {titulo}
          </ThemedText>
          <View style={styles.chips}>
            {ENTRADAS.filter(([, c]) => c.familia === familia).map(([clave, c]) => {
              const elegida = clave === valor;
              return (
                <Pressable
                  key={clave}
                  onPress={() => onCambio(clave)}
                  accessibilityState={{ selected: elegida }}
                  style={[
                    styles.chip,
                    {
                      borderColor: elegida ? tema.primary : tema.border,
                      backgroundColor: elegida ? tema.primarySoft : tema.backgroundElement,
                    },
                  ]}>
                  <ThemedText type="small" style={{ color: elegida ? tema.primary : tema.text }}>
                    {c.nombre}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.pastilla,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
  },
});
