import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ResultadoEscaneo } from '@/application/ServicioEscaneo';
import { Boton } from '@/components/boton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useEscaneo } from '@/hooks/use-neceser';

const TIPOS = ['ean13', 'ean8', 'upc_a'] as const;

function irAlResultado(r: Exclude<ResultadoEscaneo, { tipo: 'invalido' }>) {
  if (r.tipo === 'existente') {
    router.replace({ pathname: '/producto/[id]', params: { id: r.productoId, yaLoTienes: '1' } });
    return;
  }
  const f = r.ficha;
  router.replace({
    pathname: '/producto/nuevo',
    params: {
      ean: r.ean.valor,
      ...(f?.marca && { marca: f.marca }),
      ...(f?.nombre && { nombre: f.nombre }),
      ...(f?.categoria && { categoria: f.categoria }),
      ...(f?.paoMeses && { pao: String(f.paoMeses) }),
      ...(f?.imagenUrl && { imagen: f.imagenUrl }),
      ...(f && { fuente: f.fuente }),
      ...(r.sinConexion && { sinConexion: '1' }),
    },
  });
}

const aMano = () => router.replace('/producto/nuevo');

export default function EscanearScreen() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const escaneo = useEscaneo();
  const insets = useSafeAreaInsets();
  const [buscando, setBuscando] = useState(false);
  // La cámara notifica el mismo código muchas veces por segundo: solo atendemos el primero.
  const ocupado = useRef(false);

  async function alLeer({ data }: BarcodeScanningResult) {
    if (ocupado.current) return;
    ocupado.current = true;
    setBuscando(true);
    const resultado = await escaneo.identificar(data);
    if (resultado.tipo === 'invalido') {
      // Lectura defectuosa: seguimos escaneando.
      ocupado.current = false;
      setBuscando(false);
      return;
    }
    irAlResultado(resultado);
  }

  if (!permiso) return <ThemedView style={styles.flex} />;

  if (!permiso.granted) {
    return (
      <ThemedView style={[styles.flex, styles.centro]}>
        <ThemedText style={styles.centrado}>
          Para leer el código de barras hace falta permiso para usar la cámara.
        </ThemedText>
        {permiso.canAskAgain ? (
          <Boton titulo="Dar permiso" onPress={pedirPermiso} />
        ) : (
          <ThemedText themeColor="textSecondary" style={styles.centrado}>
            Actívalo en los ajustes del móvil (Aplicaciones → permisos → Cámara).
          </ThemedText>
        )}
        <Boton titulo="Escribir a mano" variante="secundario" onPress={aMano} />
      </ThemedView>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: [...TIPOS] }}
        onBarcodeScanned={buscando ? undefined : alLeer}
      />
      <View style={styles.marcoContenedor} pointerEvents="none">
        <View style={styles.marco} />
        <ThemedText style={styles.ayuda}>
          {buscando ? 'Buscando…' : 'Apunta al código de barras del envase'}
        </ThemedText>
        {buscando && <ActivityIndicator color="#fff" />}
      </View>
      <View style={[styles.abajo, { bottom: insets.bottom + Spacing.four }]}>
        <Boton titulo="Escribir a mano" variante="secundario" onPress={aMano} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#000',
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centrado: {
    textAlign: 'center',
  },
  marcoContenedor: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  marco: {
    width: '80%',
    height: 160,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: Spacing.three,
  },
  ayuda: {
    color: '#fff',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  abajo: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.pastilla,
  },
});
