import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import type { ResumenProducto, ServicioNeceser } from '@/application/ServicioNeceser';
import { Boton } from '@/components/boton';
import { BotePao } from '@/components/bote-pao';
import { EstadoCaducidad } from '@/components/estado-caducidad';
import { Miniatura } from '@/components/selector-foto';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CATEGORIAS } from '@/domain/productos/Categoria';
import { useConsulta } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';
import { uriFoto } from '@/infrastructure/fotos/FotosEnDispositivo';

const cargarResumen = (neceser: ServicioNeceser, hoy: Date) => neceser.resumen(hoy);

const irAEscanear = () => router.push('/producto/escanear');
const irANuevo = () => router.push('/producto/nuevo');

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export default function NeceserScreen() {
  const { datos: resumen, cargando } = useConsulta(cargarResumen, undefined);
  const tema = useTheme();

  if (cargando) return <ThemedView style={styles.flex} />;

  if (!resumen?.length) {
    return (
      <ThemedView style={styles.vacio}>
        <View style={[styles.circulo, { backgroundColor: tema.primarySoft }]}>
          <BotePao meses="12M" color={tema.primary} tamano={56} />
        </View>
        <ThemedText type="subtitle" style={styles.centrado}>
          Tu neceser está vacío
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centrado}>
          Añade tus productos y verás de un vistazo cuáles caducan pronto.
        </ThemedText>
        <View style={styles.botones}>
          <Boton titulo="Escanear un producto" onPress={irAEscanear} />
          <Boton titulo="Añadir a mano" variante="secundario" onPress={irANuevo} />
        </View>
      </ThemedView>
    );
  }

  const caducados = resumen.filter((r) => r.estado.tipo === 'caducado').length;
  const pronto = resumen.filter((r) => r.estado.tipo === 'caducaPronto').length;

  return (
    <ThemedView style={styles.flex}>
      <FlatList
        data={resumen}
        keyExtractor={(r) => r.producto.id}
        renderItem={({ item }) => <FilaProducto resumen={item} />}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          caducados + pronto > 0 ? (
            <View style={styles.resumen}>
              {caducados > 0 && (
                <View style={[styles.pastilla, { backgroundColor: tema.caducadoSoft }]}>
                  <ThemedText type="smallBold" style={{ color: tema.caducado }}>
                    {plural(caducados, 'caducado', 'caducados')}
                  </ThemedText>
                </View>
              )}
              {pronto > 0 && (
                <View style={[styles.pastilla, { backgroundColor: tema.caducaProntoSoft }]}>
                  <ThemedText type="smallBold" style={{ color: tema.caducaPronto }}>
                    {plural(pronto, 'caduca pronto', 'caducan pronto')}
                  </ThemedText>
                </View>
              )}
            </View>
          ) : undefined
        }
      />
      <Pressable
        onPress={irAEscanear}
        accessibilityLabel="Escanear un producto"
        style={({ pressed }) => [styles.fab, { backgroundColor: tema.primary, opacity: pressed ? 0.85 : 1 }]}>
        <MaterialCommunityIcons name="plus" size={30} color={tema.onPrimary} />
      </Pressable>
    </ThemedView>
  );
}

function FilaProducto({ resumen }: { resumen: ResumenProducto }) {
  const { producto, estado, botesEnUso, botesAbiertos } = resumen;
  const tema = useTheme();
  const subtitulo = [CATEGORIAS[producto.categoria].nombre, producto.tono].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/producto/[id]', params: { id: producto.id } })}
      style={({ pressed }) => [
        styles.fila,
        { backgroundColor: tema.backgroundElement, opacity: pressed ? 0.7 : estado.tipo === 'terminado' ? 0.55 : 1 },
      ]}>
      <Miniatura
        uri={producto.foto && uriFoto(producto.foto)}
        marca={producto.marca}
        colorTono={producto.colorTono}
        tamano={52}
      />
      <View style={styles.texto}>
        <ThemedText type="marca">{producto.marca}</ThemedText>
        <ThemedText type="medium" numberOfLines={1}>
          {producto.nombre}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {subtitulo}
        </ThemedText>
        <EstadoCaducidad estado={estado} abierto={botesAbiertos > 0} />
      </View>
      {botesEnUso > 1 && (
        <View style={[styles.botes, { backgroundColor: tema.primarySoft }]}>
          <ThemedText type="small" style={{ color: tema.primary, fontFamily: Fonts.semibold }}>
            ×{botesEnUso}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  circulo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botones: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  centrado: {
    textAlign: 'center',
  },
  lista: {
    paddingHorizontal: Spacing.three,
    paddingBottom: 104,
    gap: Spacing.two,
  },
  resumen: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  pastilla: {
    borderRadius: Radius.pastilla,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three - Spacing.one,
    borderRadius: Radius.tarjeta,
  },
  texto: {
    flex: 1,
    gap: 1,
  },
  botes: {
    borderRadius: Radius.pastilla,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#9E2B5B',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
