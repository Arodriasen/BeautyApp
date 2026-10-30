import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { ResumenProducto, ServicioNeceser } from '@/application/ServicioNeceser';
import { Boton } from '@/components/boton';
import { BotePao } from '@/components/bote-pao';
import { EstadoCaducidad } from '@/components/estado-caducidad';
import { Miniatura } from '@/components/selector-foto';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CATEGORIAS, type Familia } from '@/domain/productos/Categoria';
import { ingredientesEvitados } from '@/domain/productos/Ingredientes';
import { useConsulta, useEvitar } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';
import { uriFoto } from '@/infrastructure/fotos/FotosEnDispositivo';
import { coincide } from '@/utils/texto';

const cargarResumen = (neceser: ServicioNeceser, hoy: Date) => neceser.resumen(hoy);

const irAEscanear = () => router.push('/producto/escanear');
const irANuevo = () => router.push('/producto/nuevo');

type Urgencia = 'caducado' | 'caducaPronto';

const FAMILIAS: { valor: Familia | undefined; texto: string }[] = [
  { valor: undefined, texto: 'Todo' },
  { valor: 'maquillaje', texto: 'Maquillaje' },
  { valor: 'cuidado', texto: 'Cuidado' },
  { valor: 'otros', texto: 'Otros' },
];

const textoBuscable = ({ producto: p }: ResumenProducto) =>
  [p.marca, p.nombre, p.tono, CATEGORIAS[p.categoria].nombre].filter(Boolean).join(' ');

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export default function NeceserScreen() {
  const { datos: resumen, cargando } = useConsulta(cargarResumen, undefined);
  const tema = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [familia, setFamilia] = useState<Familia>();
  const [urgencia, setUrgencia] = useState<Urgencia>();
  const evitar = useEvitar();

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
  const visibles = resumen.filter(
    (r) =>
      (!familia || CATEGORIAS[r.producto.categoria].familia === familia) &&
      (!urgencia || r.estado.tipo === urgencia) &&
      coincide(textoBuscable(r), busqueda),
  );
  const hayFiltro = !!(busqueda.trim() || familia || urgencia);
  const alternarUrgencia = (u: Urgencia) => setUrgencia(urgencia === u ? undefined : u);
  const quitarFiltros = () => {
    setBusqueda('');
    setFamilia(undefined);
    setUrgencia(undefined);
  };

  return (
    <ThemedView style={styles.flex}>
      <FlatList
        data={visibles}
        keyExtractor={(r) => r.producto.id}
        renderItem={({ item }) => <FilaProducto resumen={item} evitar={evitar} />}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.cabeceraLista}>
            <View style={[styles.buscador, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
              <MaterialCommunityIcons name="magnify" size={20} color={tema.textSecondary} />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar marca, nombre, tono…"
                placeholderTextColor={tema.textSecondary}
                returnKeyType="search"
                style={[styles.entrada, { color: tema.text }]}
              />
              {busqueda.length > 0 && (
                <Pressable onPress={() => setBusqueda('')} hitSlop={10} accessibilityLabel="Borrar la búsqueda">
                  <MaterialCommunityIcons name="close-circle" size={18} color={tema.textSecondary} />
                </Pressable>
              )}
            </View>
            <View style={styles.chips}>
              {FAMILIAS.map(({ valor, texto }) => {
                const activo = familia === valor;
                return (
                  <Pressable
                    key={texto}
                    onPress={() => setFamilia(valor)}
                    accessibilityState={{ selected: activo }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: activo ? tema.primary : tema.backgroundElement,
                        borderColor: activo ? tema.primary : tema.border,
                      },
                    ]}>
                    <ThemedText type="small" style={{ color: activo ? tema.onPrimary : tema.text }}>
                      {texto}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {caducados + pronto > 0 && (
              <View style={styles.resumen}>
                {caducados > 0 && (
                  <Pastilla
                    texto={plural(caducados, 'caducado', 'caducados')}
                    color={tema.caducado}
                    fondo={tema.caducadoSoft}
                    activa={urgencia === 'caducado'}
                    onPress={() => alternarUrgencia('caducado')}
                  />
                )}
                {pronto > 0 && (
                  <Pastilla
                    texto={plural(pronto, 'caduca pronto', 'caducan pronto')}
                    color={tema.caducaPronto}
                    fondo={tema.caducaProntoSoft}
                    activa={urgencia === 'caducaPronto'}
                    onPress={() => alternarUrgencia('caducaPronto')}
                  />
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.sinResultados}>
            <ThemedText themeColor="textSecondary" style={styles.centrado}>
              Ningún producto coincide.
            </ThemedText>
            {hayFiltro && (
              <Pressable onPress={quitarFiltros} hitSlop={8}>
                <ThemedText type="smallBold" style={{ color: tema.primary }}>
                  Quitar filtros
                </ThemedText>
              </Pressable>
            )}
          </View>
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

/** Etiqueta de urgencia; tocarla filtra la lista (y tocarla otra vez quita el filtro). */
function Pastilla(props: { texto: string; color: string; fondo: string; activa: boolean; onPress: () => void }) {
  const { texto, color, fondo, activa, onPress } = props;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
      style={[styles.pastilla, { backgroundColor: activa ? color : fondo }]}>
      <ThemedText type="smallBold" style={{ color: activa ? '#FFFFFF' : color }}>
        {texto}
      </ThemedText>
    </Pressable>
  );
}

function FilaProducto({ resumen, evitar }: { resumen: ResumenProducto; evitar: string[] }) {
  const { producto, estado, botesEnUso, botesAbiertos } = resumen;
  const tema = useTheme();
  const subtitulo = [CATEGORIAS[producto.categoria].nombre, producto.tono].filter(Boolean).join(' · ');
  const contieneEvitados = ingredientesEvitados(producto.ingredientes ?? [], evitar).length > 0;

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
      {contieneEvitados && (
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={20}
          color={tema.caducado}
          accessibilityLabel="Contiene ingredientes que evitas"
        />
      )}
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
  cabeceraLista: {
    gap: Spacing.two + Spacing.one,
    paddingBottom: Spacing.one,
  },
  buscador: {
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
    fontSize: 16,
    paddingVertical: Spacing.two + Spacing.one,
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
  sinResultados: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  resumen: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
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
