import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const OPCIONES: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

/** Abre la cámara (pidiendo permiso). Devuelve la URI de la foto o `undefined` si se cancela. */
export async function hacerFoto(): Promise<string | undefined> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) {
    Alert.alert('Sin permiso de cámara', 'Actívalo en los ajustes del móvil para poder hacer fotos.');
    return undefined;
  }
  const r = await ImagePicker.launchCameraAsync(OPCIONES);
  return r.canceled ? undefined : r.assets[0].uri;
}

/** Abre la galería. Devuelve la URI de la foto o `undefined` si se cancela. */
export async function elegirDeGaleria(): Promise<string | undefined> {
  const r = await ImagePicker.launchImageLibraryAsync(OPCIONES);
  return r.canceled ? undefined : r.assets[0].uri;
}

interface Props {
  /** URI que se está mostrando (archivo local o https). */
  valor: string | undefined;
  onCambio: (uri: string | undefined) => void;
}

export function SelectorFoto({ valor, onCambio }: Props) {
  const tema = useTheme();

  const usar = async (elegir: () => Promise<string | undefined>) => {
    const uri = await elegir();
    if (uri) onCambio(uri);
  };

  return (
    <View style={styles.fila}>
      <View style={[styles.marco, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
        {valor ? (
          <Image source={valor} style={styles.imagen} contentFit="cover" />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Sin foto
          </ThemedText>
        )}
      </View>
      <View style={styles.botones}>
        <Boton titulo="Hacer foto" variante="secundario" onPress={() => usar(hacerFoto)} />
        <Boton titulo="Galería" variante="secundario" onPress={() => usar(elegirDeGaleria)} />
        {valor && <Boton titulo="Quitar foto" variante="peligro" onPress={() => onCambio(undefined)} />}
      </View>
    </View>
  );
}

interface MiniaturaProps {
  uri: string | undefined;
  marca: string;
  /** Color del tono ('#RRGGBB'): un punto en la esquina, como una muestra. */
  colorTono?: string;
  tamano?: number;
}

/** Miniatura redonda (como una polvera); sin foto, la inicial de la marca en Bodoni. */
export function Miniatura({ uri, marca, colorTono, tamano = 56 }: MiniaturaProps) {
  const tema = useTheme();
  const caja = { width: tamano, height: tamano, borderRadius: tamano / 2 };
  const punto = Math.round(tamano * 0.32);
  return (
    <View style={{ width: tamano, height: tamano }}>
      {uri ? (
        <Image source={uri} style={caja} contentFit="cover" />
      ) : (
        <View style={[caja, styles.inicial, { backgroundColor: tema.primarySoft }]}>
          <ThemedText
            style={{ color: tema.primary, fontFamily: Fonts.displayRecta, fontSize: tamano / 2.3, lineHeight: tamano / 1.9 }}>
            {marca.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
      )}
      {colorTono && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[
            styles.punto,
            {
              width: punto,
              height: punto,
              borderRadius: punto / 2,
              backgroundColor: colorTono,
              borderColor: tema.backgroundElement,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  marco: {
    width: 120,
    height: 120,
    borderRadius: Radius.tarjeta,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  botones: {
    flex: 1,
    gap: Spacing.two,
  },
  punto: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    borderWidth: 2,
  },
  inicial: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
