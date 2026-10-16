import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/components/boton';
import { CamposBote, useCamposBote } from '@/components/campos-bote';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useNeceser } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';

export default function NuevoBoteScreen() {
  const { productoId } = useLocalSearchParams<{ productoId: string }>();
  const neceser = useNeceser();
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const bote = useCamposBote();
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    try {
      await neceser.nuevoBote(productoId, bote.valor);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGuardando(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + Spacing.four }]}>
        <CamposBote {...bote.props} />
        {error && <ThemedText style={{ color: tema.danger }}>{error}</ThemedText>}
        <Boton titulo="Guardar" onPress={guardar} deshabilitado={guardando} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenido: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
