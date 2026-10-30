import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/components/boton';
import { Campo } from '@/components/campo';
import { CamposProducto, useCamposProducto } from '@/components/campos-producto';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Producto } from '@/domain/productos/Producto';
import { useNeceser } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';

export default function EditarProductoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const neceser = useNeceser();
  const [producto, setProducto] = useState<Producto | null>();

  useEffect(() => {
    neceser.detalle(id, new Date()).then((d) => setProducto(d?.producto ?? null));
  }, [neceser, id]);

  if (producto === undefined) return <ThemedView style={styles.flex} />;
  if (producto === null) {
    return (
      <ThemedView style={[styles.flex, styles.contenido]}>
        <ThemedText>Este producto ya no existe.</ThemedText>
      </ThemedView>
    );
  }
  // El formulario se monta con el producto ya cargado para que arranque relleno.
  return <Formulario producto={producto} />;
}

function Formulario({ producto }: { producto: Producto }) {
  const neceser = useNeceser();
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const campos = useCamposProducto({
    marca: producto.marca,
    nombre: producto.nombre,
    tono: producto.tono ?? '',
    colorTono: producto.colorTono,
    categoria: producto.categoria,
    pao: producto.pao ? String(producto.pao.meses) : '',
  });
  const [ean, setEan] = useState(producto.ean?.valor ?? '');
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const r = campos.validar();
    if ('error' in r) {
      setError(r.error);
      return;
    }
    setError(undefined);
    setGuardando(true);
    try {
      await neceser.editarProducto(producto.id, { ...r.datos, ean });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGuardando(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + Spacing.four }]}>
          <CamposProducto valores={campos.valores} cambiar={campos.cambiar} />
          <Campo
            etiqueta="Código de barras (opcional)"
            value={ean}
            onChangeText={setEan}
            keyboardType="number-pad"
            maxLength={13}
            placeholder="8, 12 o 13 cifras"
          />
          {error && <ThemedText style={{ color: tema.danger }}>{error}</ThemedText>}
          <Boton titulo="Guardar cambios" onPress={guardar} deshabilitado={guardando} />
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
});
