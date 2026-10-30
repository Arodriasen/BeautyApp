import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { ResultadoConNeceser } from '@/application/ServicioEscaneo';
import { Miniatura } from '@/components/selector-foto';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CATEGORIAS } from '@/domain/productos/Categoria';
import { useEscaneo } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  onElegir: (resultado: ResultadoConNeceser) => void;
}

/**
 * Busca el producto por nombre en internet (Open Beauty Facts, Makeup API y, si salen pocos,
 * UPCitemdb). Se busca al pulsar, no al escribir: las bases abiertas permiten pocas
 * búsquedas por minuto.
 */
export function BuscadorProducto({ onElegir }: Props) {
  const escaneo = useEscaneo();
  const tema = useTheme();
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<ResultadoConNeceser[]>();
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string>();

  async function buscar() {
    if (texto.trim().length < 2) return;
    setBuscando(true);
    setError(undefined);
    try {
      setResultados(await escaneo.buscarPorNombre(texto));
    } catch {
      setError('No se ha podido buscar. Comprueba la conexión e inténtalo otra vez.');
    } finally {
      setBuscando(false);
    }
  }

  function elegir(r: ResultadoConNeceser) {
    setResultados(undefined);
    onElegir(r);
  }

  return (
    <View style={[styles.caja, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
      <ThemedText type="smallBold">Buscar el producto</ThemedText>
      <View style={styles.fila}>
        <View style={[styles.buscador, { borderColor: tema.border, backgroundColor: tema.background }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={tema.textSecondary} />
          <TextInput
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={buscar}
            returnKeyType="search"
            placeholder="Marca y nombre (p. ej. lash sensational)"
            placeholderTextColor={tema.textSecondary}
            style={[styles.entrada, { color: tema.text }]}
          />
        </View>
        <Pressable
          onPress={buscar}
          disabled={buscando}
          accessibilityLabel="Buscar"
          style={[styles.boton, { backgroundColor: tema.primary, opacity: buscando ? 0.6 : 1 }]}>
          {buscando ? (
            <ActivityIndicator color={tema.onPrimary} />
          ) : (
            <MaterialCommunityIcons name="arrow-right" size={22} color={tema.onPrimary} />
          )}
        </Pressable>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Rellena marca, nombre, categoría, foto y código. Si no aparece, escríbelo abajo.
      </ThemedText>

      {error && <ThemedText type="small" style={{ color: tema.danger }}>{error}</ThemedText>}

      {resultados && resultados.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          No hemos encontrado nada. Prueba con menos palabras o solo la marca y el nombre.
        </ThemedText>
      )}

      {resultados?.map((r, i) => (
        <Pressable
          key={`${r.ean ?? r.nombre}-${i}`}
          onPress={() => elegir(r)}
          style={({ pressed }) => [
            styles.resultado,
            { borderTopColor: tema.border, opacity: pressed ? 0.6 : 1 },
          ]}>
          <Miniatura uri={r.imagenUrl} marca={r.marca ?? r.nombre ?? '?'} tamano={44} />
          <View style={styles.flex}>
            {r.marca && <ThemedText type="marca">{r.marca}</ThemedText>}
            <ThemedText numberOfLines={2}>{r.nombre}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {[r.categoria && CATEGORIAS[r.categoria].nombre, r.fuente].filter(Boolean).join(' · ')}
            </ThemedText>
          </View>
          {r.productoId ? (
            <View style={[styles.yaLoTiene, { backgroundColor: tema.primarySoft }]}>
              <ThemedText type="small" style={{ color: tema.primary, fontFamily: Fonts.semibold }}>
                Ya lo tienes
              </ThemedText>
            </View>
          ) : (
            <MaterialCommunityIcons name="chevron-right" size={22} color={tema.textSecondary} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  caja: {
    borderWidth: 1,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  buscador: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pastilla,
    paddingHorizontal: Spacing.three,
  },
  entrada: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    paddingVertical: Spacing.two + Spacing.one,
  },
  boton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.two + Spacing.one,
    borderTopWidth: 1,
  },
  yaLoTiene: {
    borderRadius: Radius.pastilla,
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.half,
  },
});
