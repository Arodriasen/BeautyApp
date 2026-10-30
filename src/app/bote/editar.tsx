import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/components/boton';
import { CampoFecha } from '@/components/campo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Unidad } from '@/domain/inventario/Unidad';
import { useNeceser } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';

export default function EditarBoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const neceser = useNeceser();
  const [bote, setBote] = useState<Unidad | null>();

  useEffect(() => {
    neceser.obtenerBote(id).then((u) => setBote(u ?? null));
  }, [neceser, id]);

  if (bote === undefined) return <ThemedView style={styles.flex} />;
  if (bote === null) {
    return (
      <ThemedView style={[styles.flex, styles.contenido]}>
        <ThemedText>Este bote ya no existe.</ThemedText>
      </ThemedView>
    );
  }
  return <Formulario bote={bote} />;
}

function Formulario({ bote }: { bote: Unidad }) {
  const neceser = useNeceser();
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const [apertura, setApertura] = useState(bote.fechaApertura);
  const [caducidad, setCaducidad] = useState(bote.caducidadFabricante);
  const [compra, setCompra] = useState(bote.fechaCompra);
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setError(undefined);
    setGuardando(true);
    try {
      await neceser.corregirBote(bote.id, {
        fechaApertura: apertura,
        caducidadFabricante: caducidad,
        fechaCompra: compra,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGuardando(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + Spacing.four }]}>
        <CampoFecha etiqueta="Abierto el" valor={apertura} onCambio={setApertura} maximumDate={new Date()} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.ayuda}>
          Si lo quitas, el bote vuelve a estar sin abrir.
        </ThemedText>
        <CampoFecha
          etiqueta="Caducidad impresa"
          valor={caducidad}
          onCambio={setCaducidad}
          minimumDate={new Date(2000, 0, 1)}
        />
        <CampoFecha etiqueta="Comprado el" valor={compra} onCambio={setCompra} maximumDate={new Date()} />
        {bote.fechaTerminado && (
          <ThemedText type="small" themeColor="textSecondary">
            Este bote está terminado; la fecha de terminado no se cambia aquí.
          </ThemedText>
        )}
        {error && <ThemedText style={{ color: tema.danger }}>{error}</ThemedText>}
        <Boton titulo="Guardar cambios" onPress={guardar} deshabilitado={guardando} />
      </ScrollView>
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
  ayuda: {
    marginTop: -Spacing.two,
  },
});
