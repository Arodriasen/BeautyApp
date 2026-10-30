import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ResultadoConNeceser } from '@/application/ServicioEscaneo';
import { Boton } from '@/components/boton';
import type { TonoSugerido } from '@/application/CatalogoExterno';
import { BuscadorProducto } from '@/components/buscador-producto';
import { CamposBote, useCamposBote } from '@/components/campos-bote';
import { CamposProducto, esCategoria, useCamposProducto } from '@/components/campos-producto';
import { SelectorFoto } from '@/components/selector-foto';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TonosSugeridos } from '@/components/tonos-sugeridos';
import { Radius, Spacing } from '@/constants/theme';
import { useEscaneo, useNeceser } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';

/** Parámetros que llegan del escáner; todos opcionales (alta a mano = ninguno). */
type Params = {
  ean?: string;
  marca?: string;
  nombre?: string;
  categoria?: string;
  pao?: string;
  imagen?: string;
  fuente?: string;
  sinConexion?: string;
};

export default function NuevoProductoScreen() {
  const params = useLocalSearchParams<Params>();
  const neceser = useNeceser();
  const escaneo = useEscaneo();
  const tema = useTheme();
  const insets = useSafeAreaInsets();

  const producto = useCamposProducto({
    marca: params.marca ?? '',
    nombre: params.nombre ?? '',
    categoria: esCategoria(params.categoria) ? params.categoria : undefined,
    pao: params.pao ?? '',
  });
  // La del catálogo viene preseleccionada; se puede cambiar por una propia.
  const [foto, setFoto] = useState<string | undefined>(params.imagen);
  // Código y origen de los datos: del escáner o de la búsqueda por nombre.
  const [ean, setEan] = useState<string | undefined>(params.ean);
  const [fuente, setFuente] = useState<string | undefined>(params.fuente);
  const desdeEscaner = !!params.ean;
  const [tonos, setTonos] = useState<TonoSugerido[]>();
  // Del escáner no llegan tonos: se buscan aquí aparte (Makeup API descarga 1,6 MB y no debe frenar el escaneo).
  useEffect(() => {
    if (!desdeEscaner) return;
    let vigente = true;
    escaneo.buscarTonos(params.marca, params.nombre).then((t) => {
      if (vigente && t) setTonos(t);
    });
    return () => {
      vigente = false;
    };
  }, [desdeEscaner, escaneo, params.marca, params.nombre]);
  const bote = useCamposBote();
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const r = producto.validar();
    if ('error' in r) {
      setError(r.error);
      return;
    }
    setError(undefined);
    setGuardando(true);
    try {
      await neceser.nuevoProducto({ ...r.datos, ean, foto, ...bote.valor });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGuardando(false);
    }
  }

  function elegir(r: ResultadoConNeceser) {
    if (r.productoId) {
      router.replace({ pathname: '/producto/[id]', params: { id: r.productoId, yaLoTienes: '1' } });
      return;
    }
    producto.cambiar({
      marca: r.marca ?? '',
      nombre: r.nombre ?? '',
      ...(r.categoria && { categoria: r.categoria }),
      pao: r.paoMeses ? String(r.paoMeses) : '',
    });
    if (r.imagenUrl) setFoto(r.imagenUrl);
    setEan(r.ean);
    setFuente(r.fuente);
    setTonos(r.tonos);
    setError(undefined);
  }

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + Spacing.four }]}>
          {!desdeEscaner && <BuscadorProducto onElegir={elegir} />}

          {(ean || fuente) && (
            <ThemedView type="backgroundElement" style={styles.aviso}>
              <View style={styles.flex}>
                {ean && (
                  <ThemedText type="small" themeColor="textSecondary">
                    Código {ean}
                  </ThemedText>
                )}
                <ThemedText type="small">
                  {fuente
                    ? `Datos de ${fuente}. Revísalos: a veces vienen en otro idioma o incompletos.`
                    : params.sinConexion
                      ? 'Sin conexión: no se ha podido buscar el producto. Rellénalo a mano.'
                      : 'No lo hemos encontrado. Rellénalo y la próxima vez que lo escanees lo reconocerá.'}
                </ThemedText>
              </View>
              {!desdeEscaner && ean && (
                <Pressable onPress={() => setEan(undefined)} hitSlop={8} accessibilityLabel="Quitar el código de barras">
                  <ThemedText type="small" style={{ color: tema.primary }}>
                    Quitar código
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
          )}

          {tonos && (
            <TonosSugeridos
              tonos={tonos}
              elegido={producto.valores.colorTono}
              onElegir={(t) => producto.cambiar({ colorTono: t.color, ...(t.nombre && { tono: t.nombre }) })}
            />
          )}

          <CamposProducto valores={producto.valores} cambiar={producto.cambiar} />

          <View style={styles.seccion}>
            <ThemedText type="smallBold">Foto (opcional)</ThemedText>
            <SelectorFoto valor={foto} onCambio={setFoto} />
          </View>

          <CamposBote {...bote.props} />

          {error && <ThemedText style={{ color: tema.danger }}>{error}</ThemedText>}

          <Boton titulo="Guardar" onPress={guardar} deshabilitado={guardando} />
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
  seccion: {
    gap: Spacing.two,
  },
  aviso: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.tarjeta,
    alignItems: 'center',
  },
});
