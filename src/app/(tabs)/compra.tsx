import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import type { ArticuloConProducto, ListaCompra, MotivoSugerencia } from '@/application/ServicioCompra';
import { Boton } from '@/components/boton';
import { Miniatura } from '@/components/selector-foto';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useCompra, useNeceser } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';
import { uriFoto } from '@/infrastructure/fotos/FotosEnDispositivo';

const MOTIVO: Record<MotivoSugerencia, { texto: string; color: ThemeColor }> = {
  caducado: { texto: 'Caducado', color: 'caducado' },
  caducaPronto: { texto: 'Caduca pronto', color: 'caducaPronto' },
  terminado: { texto: 'Terminado', color: 'neutro' },
};

export default function CompraScreen() {
  const compra = useCompra();
  const neceser = useNeceser();
  const tema = useTheme();
  const [lista, setLista] = useState<ListaCompra>();
  const [texto, setTexto] = useState('');

  const recargar = useCallback(async () => {
    setLista(await compra.lista(new Date()));
  }, [compra]);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  if (!lista) return <ThemedView style={styles.flex} />;

  async function anadirTexto() {
    if (!texto.trim()) return;
    await compra.anadirTexto(texto);
    setTexto('');
    await recargar();
  }

  async function marcar({ articulo, producto }: ArticuloConProducto) {
    const comprado = !articulo.comprado;
    await compra.marcarComprado(articulo.id, comprado);
    await recargar();
    if (comprado && producto) {
      Alert.alert('¡Comprado!', `¿Añado un bote nuevo de ${producto.nombre} a tu neceser?`, [
        { text: 'No', style: 'cancel' },
        {
          text: 'Añadir bote',
          onPress: async () => {
            await neceser.nuevoBote(producto.id, { fechaCompra: new Date() });
          },
        },
      ]);
    }
  }

  function eliminar({ articulo }: ArticuloConProducto) {
    Alert.alert('¿Quitar de la lista?', articulo.descripcion, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          await compra.eliminar(articulo.id);
          await recargar();
        },
      },
    ]);
  }

  async function vaciar() {
    await compra.vaciarComprados();
    await recargar();
  }

  const { pendientes, comprados, sugerencias } = lista;

  return (
    <ThemedView style={styles.flex}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.contenido}>
        <View style={styles.fila}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={anadirTexto}
            submitBehavior="submit"
            returnKeyType="done"
            placeholder="Añadir algo (p. ej. algodones)"
            placeholderTextColor={tema.textSecondary}
            style={[
              styles.entrada,
              { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement },
            ]}
          />
          <Pressable
            onPress={anadirTexto}
            accessibilityLabel="Añadir"
            style={({ pressed }) => [styles.mas, { backgroundColor: tema.primary, opacity: pressed ? 0.7 : 1 }]}>
            <MaterialCommunityIcons name="plus" size={26} color={tema.onPrimary} />
          </Pressable>
        </View>
        <Boton titulo="Añadir de mi neceser" variante="secundario" onPress={() => router.push('/compra/anadir')} />

        {pendientes.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.centrado}>
            La lista está vacía.
          </ThemedText>
        ) : (
          <View>
            {pendientes.map((item) => (
              <FilaArticulo key={item.articulo.id} item={item} onMarcar={marcar} onEliminar={eliminar} />
            ))}
          </View>
        )}

        {sugerencias.length > 0 && (
          <View style={styles.seccion}>
            <ThemedText type="smallBold">Para reponer</ThemedText>
            {sugerencias.map(({ producto, motivo }) => (
              <View key={producto.id} style={styles.filaArticulo}>
                <Miniatura
                  uri={producto.foto && uriFoto(producto.foto)}
                  marca={producto.marca}
                  colorTono={producto.colorTono}
                  tamano={40}
                />
                <View style={styles.flex}>
                  <ThemedText>
                    {producto.marca} · {producto.nombre}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: tema[MOTIVO[motivo].color] }}>
                    {MOTIVO[motivo].texto}
                  </ThemedText>
                </View>
                <Pressable
                  hitSlop={8}
                  accessibilityLabel={`Añadir ${producto.nombre} a la lista`}
                  onPress={async () => {
                    await compra.anadirProducto(producto);
                    await recargar();
                  }}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={28} color={tema.primary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {comprados.length > 0 && (
          <View style={styles.seccion}>
            <View style={styles.cabeceraSeccion}>
              <ThemedText type="smallBold">Comprados ({comprados.length})</ThemedText>
              <Pressable onPress={vaciar} hitSlop={8}>
                <ThemedText type="small" style={{ color: tema.primary }}>
                  Vaciar
                </ThemedText>
              </Pressable>
            </View>
            {comprados.map((item) => (
              <FilaArticulo key={item.articulo.id} item={item} onMarcar={marcar} onEliminar={eliminar} />
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

interface FilaProps {
  item: ArticuloConProducto;
  onMarcar: (item: ArticuloConProducto) => void;
  onEliminar: (item: ArticuloConProducto) => void;
}

function FilaArticulo({ item, onMarcar, onEliminar }: FilaProps) {
  const tema = useTheme();
  const { articulo, producto } = item;
  const comprado = articulo.comprado;

  return (
    <Pressable
      onPress={() => onMarcar(item)}
      onLongPress={() => onEliminar(item)}
      style={[styles.filaArticulo, comprado && styles.comprado]}>
      <MaterialCommunityIcons
        name={comprado ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
        size={26}
        color={comprado ? tema.primary : tema.textSecondary}
      />
      {producto && (
        <Miniatura
          uri={producto.foto && uriFoto(producto.foto)}
          marca={producto.marca}
          colorTono={producto.colorTono}
          tamano={40}
        />
      )}
      <View style={styles.flex}>
        <ThemedText style={comprado && styles.tachado}>{articulo.descripcion}</ThemedText>
        {comprado && !articulo.productoId && (
          <Pressable
            hitSlop={8}
            onPress={() => router.push({ pathname: '/producto/nuevo', params: { nombre: articulo.descripcion } })}>
            <ThemedText type="small" style={{ color: tema.primary }}>
              Dar de alta en el neceser
            </ThemedText>
          </Pressable>
        )}
      </View>
      <Pressable hitSlop={8} onPress={() => onEliminar(item)} accessibilityLabel="Quitar de la lista">
        <MaterialCommunityIcons name="close" size={20} color={tema.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenido: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  fila: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  entrada: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.campo,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  mas: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seccion: {
    gap: Spacing.one,
  },
  cabeceraSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaArticulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  comprado: {
    opacity: 0.6,
  },
  tachado: {
    textDecorationLine: 'line-through',
  },
  centrado: {
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
});
