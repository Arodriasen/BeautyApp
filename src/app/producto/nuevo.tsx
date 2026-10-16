import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/components/boton';
import { Campo } from '@/components/campo';
import { CamposBote, useCamposBote } from '@/components/campos-bote';
import { SelectorCategoria } from '@/components/selector-categoria';
import { SelectorColorTono } from '@/components/selector-color-tono';
import { SelectorFoto } from '@/components/selector-foto';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { CATEGORIAS, type Categoria } from '@/domain/productos/Categoria';
import { useNeceser } from '@/hooks/use-neceser';
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

const esCategoria = (c: string | undefined): c is Categoria => !!c && c in CATEGORIAS;

export default function NuevoProductoScreen() {
  const params = useLocalSearchParams<Params>();
  const neceser = useNeceser();
  const tema = useTheme();
  const insets = useSafeAreaInsets();

  const [marca, setMarca] = useState(params.marca ?? '');
  const [nombre, setNombre] = useState(params.nombre ?? '');
  const [tono, setTono] = useState('');
  const [colorTono, setColorTono] = useState<string>();
  const [categoria, setCategoria] = useState<Categoria | undefined>(
    esCategoria(params.categoria) ? params.categoria : undefined,
  );
  const [pao, setPao] = useState(params.pao ?? '');
  // La del catálogo viene preseleccionada; se puede cambiar por una propia.
  const [foto, setFoto] = useState<string | undefined>(params.imagen);
  const bote = useCamposBote();
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);

  const paoHabitual = categoria ? CATEGORIAS[categoria].paoHabitual : null;

  async function guardar() {
    if (!categoria) {
      setError('Elige una categoría');
      return;
    }
    if (pao.trim() && !/^\d+$/.test(pao.trim())) {
      setError('El PAO debe ser un número de meses');
      return;
    }
    setError(undefined);
    setGuardando(true);
    try {
      await neceser.nuevoProducto({
        marca,
        nombre,
        tono,
        categoria,
        ean: params.ean,
        paoMeses: pao.trim() ? Number(pao) : undefined,
        foto,
        colorTono,
        ...bote.valor,
      });
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
          {params.ean && (
            <ThemedView type="backgroundElement" style={styles.aviso}>
              <View style={styles.flex}>
                <ThemedText type="small" themeColor="textSecondary">
                  Código {params.ean}
                </ThemedText>
                <ThemedText type="small">
                  {params.fuente
                    ? `Datos de ${params.fuente}. Revísalos: a veces vienen en otro idioma o incompletos.`
                    : params.sinConexion
                      ? 'Sin conexión: no se ha podido buscar el producto. Rellénalo a mano.'
                      : 'No lo hemos encontrado. Rellénalo y la próxima vez que lo escanees lo reconocerá.'}
                </ThemedText>
              </View>
            </ThemedView>
          )}

          <Campo
            etiqueta="Marca"
            value={marca}
            onChangeText={setMarca}
            placeholder="Ej.: Maybelline"
            autoFocus={!params.marca}
          />
          <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} placeholder="Ej.: Lash Sensational" />
          <Campo etiqueta="Tono (opcional)" value={tono} onChangeText={setTono} placeholder="Ej.: 120 Ivory" />

          <View style={styles.seccion}>
            <ThemedText type="smallBold">Color del tono (opcional)</ThemedText>
            <SelectorColorTono valor={colorTono} onCambio={setColorTono} />
          </View>

          <View style={styles.seccion}>
            <ThemedText type="smallBold">Foto (opcional)</ThemedText>
            <SelectorFoto valor={foto} onCambio={setFoto} />
          </View>

          <View style={styles.seccion}>
            <ThemedText type="smallBold">Categoría</ThemedText>
            <SelectorCategoria valor={categoria} onCambio={setCategoria} />
          </View>

          <Campo
            etiqueta="Meses tras abrir (PAO)"
            value={pao}
            onChangeText={setPao}
            keyboardType="number-pad"
            maxLength={2}
            placeholder={paoHabitual ? `Si lo dejas vacío: ${paoHabitual} meses` : 'El número del icono del bote abierto'}
          />

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
