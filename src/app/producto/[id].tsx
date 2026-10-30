import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BoteConEstado, ServicioNeceser } from '@/application/ServicioNeceser';
import { Boton } from '@/components/boton';
import { BotePao } from '@/components/bote-pao';
import { SeccionIngredientes } from '@/components/seccion-ingredientes';
import { SelectorColorTono } from '@/components/selector-color-tono';
import { elegirDeGaleria, hacerFoto } from '@/components/selector-foto';
import { TarjetaBote } from '@/components/tarjeta-bote';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { nombreDeColor } from '@/constants/tonos';
import { CATEGORIAS } from '@/domain/productos/Categoria';
import { useCompra, useConsulta, useIngredientes } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';
import { uriFoto } from '@/infrastructure/fotos/FotosEnDispositivo';
import { elegirFecha } from '@/utils/elegir-fecha';
import { formatearFecha } from '@/utils/formato';

const cargarDetalle = (neceser: ServicioNeceser, hoy: Date, id: string) => neceser.detalle(id, hoy);

function confirmar(titulo: string, mensaje: string, accion: string, alAceptar: () => void) {
  Alert.alert(titulo, mensaje, [
    { text: 'Cancelar', style: 'cancel' },
    { text: accion, style: 'destructive', onPress: alAceptar },
  ]);
}

export default function DetalleProductoScreen() {
  const { id, yaLoTienes } = useLocalSearchParams<{ id: string; yaLoTienes?: string }>();
  const { datos: detalle, cargando, recargar, neceser } = useConsulta(cargarDetalle, id);
  const compra = useCompra();
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const [enLista, setEnLista] = useState(false);
  const [eligiendoColor, setEligiendoColor] = useState(false);
  const ingredientes = useIngredientes();
  const [ajustesIngredientes, setAjustesIngredientes] = useState<{ evitar: string[]; tieneClave: boolean }>({
    evitar: [],
    tieneClave: false,
  });

  useFocusEffect(
    useCallback(() => {
      compra.enLista(id).then(setEnLista);
      ingredientes
        .obtenerAjustes()
        .then((a) => setAjustesIngredientes({ evitar: a.evitar, tieneClave: !!a.claveInci }));
    }, [compra, id, ingredientes]),
  );

  if (cargando) return <ThemedView style={styles.flex} />;

  if (!detalle) {
    return (
      <ThemedView style={[styles.flex, styles.contenido]}>
        <ThemedText>Este producto ya no existe.</ThemedText>
      </ThemedView>
    );
  }

  const { producto, enUso, terminados } = detalle;
  const pao = producto.paoEfectivo;
  const foto = producto.foto && uriFoto(producto.foto);
  const nombreColor = producto.colorTono && nombreDeColor(producto.colorTono);

  async function abrir(bote: BoteConEstado) {
    const fecha = await elegirFecha(new Date(), { maximumDate: new Date(), title: '¿Cuándo lo abriste?' });
    if (!fecha) return;
    await neceser.abrirBote(bote.unidad.id, fecha);
    await recargar();
  }

  function terminar(bote: BoteConEstado) {
    confirmar('¿Terminado?', 'Se moverá a la lista de terminados.', 'Terminado', async () => {
      await neceser.terminarBote(bote.unidad.id, new Date());
      await recargar();
    });
  }

  function eliminarBote(bote: BoteConEstado) {
    confirmar('¿Eliminar este bote?', 'Úsalo solo si lo añadiste por error.', 'Eliminar', async () => {
      await neceser.eliminarBote(bote.unidad.id);
      await recargar();
    });
  }

  async function anadirALista() {
    await compra.anadirProducto(producto);
    setEnLista(true);
  }

  async function cambiarColor(color: string | undefined) {
    await neceser.cambiarColorTono(producto.id, color);
    await recargar();
  }

  async function ponerFoto(elegir: () => Promise<string | undefined>) {
    const uri = await elegir();
    if (!uri) return;
    await neceser.cambiarFoto(producto.id, uri);
    await recargar();
  }

  function menuFoto() {
    // Android admite como mucho tres botones; "Cancelar" es tocar fuera.
    Alert.alert(
      foto ? 'Cambiar la foto' : 'Poner una foto',
      undefined,
      [
        { text: 'Galería', onPress: () => ponerFoto(elegirDeGaleria) },
        { text: 'Hacer foto', onPress: () => ponerFoto(hacerFoto) },
      ],
      { cancelable: true },
    );
  }

  function quitarFoto() {
    confirmar('¿Quitar la foto?', 'Se borrará del móvil.', 'Quitar', async () => {
      await neceser.cambiarFoto(producto.id, undefined);
      await recargar();
    });
  }

  function eliminarProducto() {
    confirmar('¿Eliminar el producto?', 'Se borrarán también todos sus botes.', 'Eliminar', async () => {
      await neceser.eliminarProducto(producto.id);
      router.back();
    });
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: '/producto/editar', params: { id: producto.id } })}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Editar el producto">
              <MaterialCommunityIcons name="pencil-outline" size={24} color={tema.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + Spacing.five }]}>
        {yaLoTienes && (
          <View style={[styles.aviso, { backgroundColor: tema.primarySoft }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={tema.primary} />
            <ThemedText type="medium" style={{ color: tema.primary }}>
              ¡Ya lo tienes en tu neceser!
            </ThemedText>
          </View>
        )}

        {/* Portada */}
        <View style={[styles.portada, { backgroundColor: tema.primarySoft }]}>
          {foto ? (
            <Image source={foto} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <ThemedText style={[styles.monograma, { color: tema.primary }]}>{producto.marca.charAt(0)}</ThemedText>
          )}
          {pao && (
            <View style={[styles.pastillaPao, { backgroundColor: tema.backgroundElement }]}>
              <BotePao meses={`${pao.meses}M`} color={tema.primary} tamano={20} />
              <ThemedText type="smallBold">{pao.meses} meses</ThemedText>
            </View>
          )}
          <View style={styles.botonesFoto}>
            {foto && (
              <Pressable
                onPress={quitarFoto}
                accessibilityLabel="Quitar la foto"
                style={[styles.botonFoto, { backgroundColor: tema.backgroundElement }]}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={tema.textSecondary} />
              </Pressable>
            )}
            <Pressable
              onPress={menuFoto}
              accessibilityLabel={foto ? 'Cambiar la foto' : 'Poner una foto'}
              style={[styles.botonFoto, { backgroundColor: tema.backgroundElement }]}>
              <MaterialCommunityIcons name="camera-outline" size={20} color={tema.primary} />
            </Pressable>
          </View>
        </View>

        {/* Nombre */}
        <View style={styles.cabecera}>
          <ThemedText type="marca">{producto.marca}</ThemedText>
          <ThemedText type="title" style={styles.nombre}>
            {producto.nombre}
          </ThemedText>
          <View style={styles.fila}>
            {producto.colorTono && (
              <View style={[styles.muestra, { backgroundColor: producto.colorTono, borderColor: tema.border }]} />
            )}
            <ThemedText themeColor="textSecondary" style={styles.flex}>
              {[producto.tono ?? nombreColor, CATEGORIAS[producto.categoria].nombre].filter(Boolean).join(' · ')}
            </ThemedText>
            <Pressable onPress={() => setEligiendoColor(!eligiendoColor)} hitSlop={8}>
              <ThemedText type="small" style={{ color: tema.primary, fontFamily: Fonts.semibold }}>
                {eligiendoColor ? 'Listo' : producto.colorTono ? 'Cambiar color' : 'Poner color'}
              </ThemedText>
            </Pressable>
          </View>
          {eligiendoColor && (
            <View style={[styles.paleta, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
              <SelectorColorTono valor={producto.colorTono} onCambio={cambiarColor} />
            </View>
          )}
        </View>

        {/* Botes */}
        <View style={styles.seccion}>
          <ThemedText type="subtitle" style={styles.tituloSeccion}>
            {enUso.length > 1 ? `En uso · ${enUso.length} botes` : 'En uso'}
          </ThemedText>
          {enUso.length === 0 && <ThemedText themeColor="textSecondary">No te queda ninguno abierto ni de repuesto.</ThemedText>}
          {enUso.map((bote, i) => (
            <TarjetaBote
              key={bote.unidad.id}
              bote={bote}
              etiqueta={enUso.length > 1 ? `Bote ${i + 1}` : undefined}
              onAbrir={() => abrir(bote)}
              onTerminar={() => terminar(bote)}
              onEditar={() => router.push({ pathname: '/bote/editar', params: { id: bote.unidad.id } })}
              onEliminar={() => eliminarBote(bote)}
            />
          ))}
          <View style={styles.fila}>
            <View style={styles.flex}>
              <Boton
                titulo="Otro bote"
                variante="secundario"
                onPress={() => router.push({ pathname: '/bote/nuevo', params: { productoId: producto.id } })}
              />
            </View>
            <View style={styles.flex}>
              <Boton
                titulo={enLista ? 'En la lista ✓' : 'A la compra'}
                variante="secundario"
                onPress={anadirALista}
                deshabilitado={enLista}
              />
            </View>
          </View>
        </View>

        {terminados.length > 0 && (
          <View style={styles.seccion}>
            <ThemedText type="subtitle" style={styles.tituloSeccion}>
              Terminados
            </ThemedText>
            <View style={[styles.lista, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
              {terminados.map((u, i) => (
                <View
                  key={u.id}
                  style={[styles.filaTerminado, i > 0 && { borderTopWidth: 1, borderTopColor: tema.border }]}>
                  <MaterialCommunityIcons name="check" size={18} color={tema.neutro} />
                  <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
                    {u.fechaApertura ? `${formatearFecha(u.fechaApertura)} → ` : 'Terminado el '}
                    {formatearFecha(u.fechaTerminado!)}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        <SeccionIngredientes
          producto={producto}
          evitar={ajustesIngredientes.evitar}
          tieneClave={ajustesIngredientes.tieneClave}
          onCambio={recargar}
        />


        {/* Detalles */}
        <View style={styles.seccion}>
          <ThemedText type="subtitle" style={styles.tituloSeccion}>
            Detalles
          </ThemedText>
          <View style={[styles.lista, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
            <Detalle titulo="Categoría" valor={CATEGORIAS[producto.categoria].nombre} />
            <Detalle
              titulo="Tras abrir"
              valor={pao ? `${pao.meses} meses (${producto.pao ? 'del envase' : 'habitual'})` : 'Sin PAO'}
              conLinea
            />
            {producto.ean && <Detalle titulo="Código de barras" valor={producto.ean.valor} conLinea />}
          </View>
        </View>

        <Pressable onPress={eliminarProducto} hitSlop={8} style={styles.eliminar} accessibilityRole="button">
          <ThemedText type="small" style={{ color: tema.danger, fontFamily: Fonts.semibold }}>
            Eliminar producto
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function Detalle({ titulo, valor, conLinea }: { titulo: string; valor: string; conLinea?: boolean }) {
  const tema = useTheme();
  return (
    <View style={[styles.filaDetalle, conLinea && { borderTopWidth: 1, borderTopColor: tema.border }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {titulo}
      </ThemedText>
      <ThemedText type="small" style={styles.valorDetalle}>
        {valor}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    gap: Spacing.four,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pastilla,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  portada: {
    height: 260,
    borderRadius: Radius.tarjeta + 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monograma: {
    fontFamily: Fonts.display,
    fontSize: 120,
    lineHeight: 150,
  },
  pastillaPao: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.pastilla,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.three,
    paddingVertical: Spacing.one,
  },
  botonesFoto: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  botonFoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  cabecera: {
    gap: Spacing.one,
  },
  nombre: {
    fontSize: 32,
    lineHeight: 38,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  muestra: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  paleta: {
    marginTop: Spacing.two,
    borderRadius: Radius.tarjeta,
    borderWidth: 1,
    padding: Spacing.three,
  },
  seccion: {
    gap: Spacing.three,
  },
  tituloSeccion: {
    fontSize: 22,
    lineHeight: 28,
  },
  lista: {
    borderRadius: Radius.tarjeta,
    borderWidth: 1,
    overflow: 'hidden',
  },
  filaTerminado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
  },
  filaDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
  },
  valorDetalle: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: Fonts.medium,
  },
  eliminar: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
});
