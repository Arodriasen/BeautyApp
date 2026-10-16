import { StyleSheet, View } from 'react-native';

import type { EstadoProducto } from '@/application/ServicioNeceser';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { colorEstado, describirEstado } from '@/utils/formato';

interface Props {
  estado: EstadoProducto;
  abierto: boolean;
}

export function EstadoCaducidad({ estado, abierto }: Props) {
  const tema = useTheme();
  const color = tema[colorEstado(estado)];
  return (
    <View style={styles.fila}>
      <View style={[styles.punto, { backgroundColor: color }]} />
      <ThemedText type="small" style={{ color }}>
        {describirEstado(estado, abierto)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
