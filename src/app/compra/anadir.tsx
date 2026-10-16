import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Miniatura } from '@/components/selector-foto';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CATEGORIAS } from '@/domain/productos/Categoria';
import type { Producto } from '@/domain/productos/Producto';
import { useCompra, useNeceser } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';
import { uriFoto } from '@/infrastructure/fotos/FotosEnDispositivo';

/** Sin tildes ni mayúsculas, para que "serum" encuentre "Sérum". */
const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export default function AnadirDeNeceserScreen() {
  const neceser = useNeceser();
  const compra = useCompra();
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [enLista, setEnLista] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState('');

  const recargar = useCallback(async () => {
    const hoy = new Date();
    const [resumen, lista] = await Promise.all([neceser.resumen(hoy), compra.lista(hoy)]);
    setProductos(
      resumen
        .map((r) => r.producto)
        .sort((a, b) => a.marca.localeCompare(b.marca) || a.nombre.localeCompare(b.nombre)),
    );
    setEnLista(new Set(lista.pendientes.flatMap((p) => (p.articulo.productoId ? [p.articulo.productoId] : []))));
  }, [neceser, compra]);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  const filtro = normalizar(busqueda.trim());
  const visibles = filtro
    ? productos.filter((p) =>
        normalizar([p.marca, p.nombre, p.tono, CATEGORIAS[p.categoria].nombre].join(' ')).includes(filtro),
      )
    : productos;

  async function anadir(producto: Producto) {
    if (enLista.has(producto.id)) return;
    await compra.anadirProducto(producto);
    setEnLista(new Set(enLista).add(producto.id));
  }

  return (
    <ThemedView style={styles.flex}>
      <View style={styles.buscador}>
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por marca, nombre, tono…"
          placeholderTextColor={tema.textSecondary}
          style={[styles.entrada, { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement }]}
        />
      </View>
      <FlatList
        data={visibles}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.four }}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.vacio}>
            {productos.length === 0 ? 'Aún no tienes productos en el neceser.' : 'No hay ninguno que coincida.'}
          </ThemedText>
        }
        renderItem={({ item: p }) => {
          const anadido = enLista.has(p.id);
          return (
            <Pressable onPress={() => anadir(p)} style={({ pressed }) => [styles.fila, { opacity: pressed ? 0.6 : 1 }]}>
              <Miniatura uri={p.foto && uriFoto(p.foto)} marca={p.marca} colorTono={p.colorTono} tamano={44} />
              <View style={styles.flex}>
                <ThemedText type="marca">{p.marca}</ThemedText>
                <ThemedText>{[p.nombre, p.tono].filter(Boolean).join(' · ')}</ThemedText>
              </View>
              {anadido ? (
                <View style={styles.anadido}>
                  <MaterialCommunityIcons name="check" size={20} color={tema.vigente} />
                  <ThemedText type="small" style={{ color: tema.vigente }}>
                    En la lista
                  </ThemedText>
                </View>
              ) : (
                <MaterialCommunityIcons name="plus-circle-outline" size={28} color={tema.primary} />
              )}
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  buscador: {
    padding: Spacing.three,
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
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  anadido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  vacio: {
    textAlign: 'center',
    padding: Spacing.four,
  },
});
