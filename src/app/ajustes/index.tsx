import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Icono = keyof typeof MaterialCommunityIcons.glyphMap;

const OPCIONES: { titulo: string; detalle: string; icono: Icono; ruta: Href }[] = [
  {
    titulo: 'Avisos de caducidad',
    detalle: 'Cuándo y con cuánta antelación avisar',
    icono: 'bell-outline',
    ruta: '/avisos',
  },
  {
    titulo: 'Ingredientes',
    detalle: 'Los que evitas y el análisis de INCI API',
    icono: 'flask-outline',
    ruta: '/ajustes/ingredientes',
  },
];

export default function AjustesScreen() {
  const tema = useTheme();
  return (
    <ThemedView style={styles.flex}>
      <View style={[styles.lista, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
        {OPCIONES.map((o, i) => (
          <Pressable
            key={o.titulo}
            onPress={() => router.push(o.ruta)}
            style={({ pressed }) => [
              styles.fila,
              i > 0 && { borderTopWidth: 1, borderTopColor: tema.border },
              { opacity: pressed ? 0.6 : 1 },
            ]}>
            <View style={[styles.icono, { backgroundColor: tema.primarySoft }]}>
              <MaterialCommunityIcons name={o.icono} size={20} color={tema.primary} />
            </View>
            <View style={styles.flex}>
              <ThemedText type="medium">{o.titulo}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {o.detalle}
              </ThemedText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={tema.textSecondary} />
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  lista: {
    margin: Spacing.three,
    borderRadius: Radius.tarjeta,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  icono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
