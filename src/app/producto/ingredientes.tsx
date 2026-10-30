import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/components/boton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { parsearListaInci } from '@/domain/productos/Ingredientes';
import { useIngredientes, useNeceser } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';

export default function EditarIngredientesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const neceser = useNeceser();
  const ingredientes = useIngredientes();
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    neceser.detalle(id, new Date()).then((d) => setTexto(d?.producto.ingredientes?.join(', ') ?? ''));
  }, [neceser, id]);

  if (texto === undefined) return <ThemedView style={styles.flex} />;

  const cuantos = parsearListaInci(texto).length;

  async function guardar() {
    try {
      await ingredientes.guardarLista(id, texto!);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + Spacing.four }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Copia la lista de la caja («Ingredients: Aqua, Glycerin…») separando los ingredientes con comas o en
            líneas distintas. Si la tienes en una web, puedes pegarla tal cual.
          </ThemedText>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            multiline
            autoCapitalize="words"
            autoCorrect={false}
            placeholder="Aqua, Glycerin, Niacinamide…"
            placeholderTextColor={tema.textSecondary}
            textAlignVertical="top"
            style={[styles.area, { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement }]}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {cuantos === 0 ? 'Sin ingredientes: al guardar se borrará la lista.' : `${cuantos} ingredientes.`}
          </ThemedText>
          {error && <ThemedText style={{ color: tema.danger }}>{error}</ThemedText>}
          <Boton titulo="Guardar" onPress={guardar} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  area: {
    minHeight: 200,
    borderWidth: 1,
    borderRadius: Radius.campo,
    padding: Spacing.three,
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
