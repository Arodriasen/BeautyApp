import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/components/boton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useIngredientes } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';

/** Términos habituales; se buscan por fragmento ("paraben" encuentra "Methylparaben"). */
const SUGERENCIAS = [
  { termino: 'Parfum', explicacion: 'perfume' },
  { termino: 'Alcohol Denat', explicacion: 'alcohol secante' },
  { termino: 'paraben', explicacion: 'parabenos' },
  { termino: 'sulfate', explicacion: 'sulfatos' },
  { termino: 'cone', explicacion: 'siliconas (-cone)' },
  { termino: 'Linalool', explicacion: 'alérgeno de fragancia' },
  { termino: 'Limonene', explicacion: 'alérgeno de fragancia' },
  { termino: 'Retinol', explicacion: 'evitar en el embarazo' },
];

export default function AjustesIngredientesScreen() {
  const servicio = useIngredientes();
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const [evitar, setEvitar] = useState<string[]>();
  const [nuevo, setNuevo] = useState('');
  const [clave, setClave] = useState('');
  const [claveGuardada, setClaveGuardada] = useState(false);

  useEffect(() => {
    servicio.obtenerAjustes().then((a) => {
      setEvitar(a.evitar);
      setClave(a.claveInci ?? '');
    });
  }, [servicio]);

  if (!evitar) return <ThemedView style={styles.flex} />;

  async function guardar(lista: string[], claveInci = clave) {
    setEvitar(lista);
    await servicio.guardarAjustes({ evitar: lista, claveInci });
  }

  const anadir = (termino: string) => {
    const t = termino.trim();
    if (!t || evitar.some((e) => e.toLowerCase() === t.toLowerCase())) return;
    guardar([...evitar, t]);
    setNuevo('');
  };

  const pendientes = SUGERENCIAS.filter((s) => !evitar.some((e) => e.toLowerCase() === s.termino.toLowerCase()));

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + Spacing.four }]}>
          <View style={styles.seccion}>
            <ThemedText type="subtitle" style={styles.titulo}>
              Ingredientes que evitas
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Te avisaremos en la ficha y en la lista si un producto los contiene. Se buscan por fragmento y sin
              tildes: «paraben» encuentra «Methylparaben». Se comprueba en el móvil, sin internet.
            </ThemedText>

            <View style={styles.chips}>
              {evitar.length === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  Todavía no has añadido ninguno.
                </ThemedText>
              )}
              {evitar.map((t) => (
                <View key={t} style={[styles.chip, { backgroundColor: tema.caducadoSoft }]}>
                  <ThemedText type="small" style={{ color: tema.caducado }}>
                    {t}
                  </ThemedText>
                  <Pressable onPress={() => guardar(evitar.filter((e) => e !== t))} hitSlop={8} accessibilityLabel={`Quitar ${t}`}>
                    <MaterialCommunityIcons name="close" size={16} color={tema.caducado} />
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.fila}>
              <TextInput
                value={nuevo}
                onChangeText={setNuevo}
                onSubmitEditing={() => anadir(nuevo)}
                submitBehavior="submit"
                placeholder="Añadir (p. ej. Parfum)"
                placeholderTextColor={tema.textSecondary}
                autoCapitalize="none"
                style={[styles.entrada, { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement }]}
              />
              <Pressable
                onPress={() => anadir(nuevo)}
                accessibilityLabel="Añadir"
                style={[styles.mas, { backgroundColor: tema.primary }]}>
                <MaterialCommunityIcons name="plus" size={24} color={tema.onPrimary} />
              </Pressable>
            </View>

            {pendientes.length > 0 && (
              <>
                <ThemedText type="smallBold">Sugerencias</ThemedText>
                <View style={styles.chips}>
                  {pendientes.map((s) => (
                    <Pressable
                      key={s.termino}
                      onPress={() => anadir(s.termino)}
                      style={[styles.chip, { backgroundColor: tema.backgroundElement, borderColor: tema.border, borderWidth: 1 }]}>
                      <MaterialCommunityIcons name="plus" size={14} color={tema.primary} />
                      <ThemedText type="small">
                        {s.termino} <ThemedText type="small" themeColor="textSecondary">· {s.explicacion}</ThemedText>
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>

          <View style={styles.seccion}>
            <ThemedText type="subtitle" style={styles.titulo}>
              Análisis con INCI API
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Opcional. Da una puntuación de seguridad, los alérgenos obligatorios en la UE y si es apto en el
              embarazo. Crea una clave gratis en inciapi.com (2.000 análisis al mes) y pégala aquí. Solo se guarda en
              este móvil.
            </ThemedText>
            <TextInput
              value={clave}
              onChangeText={(t) => {
                setClave(t);
                setClaveGuardada(false);
              }}
              placeholder="sk_live_…"
              placeholderTextColor={tema.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={[styles.entrada, styles.clave, { color: tema.text, borderColor: tema.border, backgroundColor: tema.backgroundElement }]}
            />
            <Boton
              titulo={claveGuardada ? 'Clave guardada ✓' : 'Guardar clave'}
              variante="secundario"
              deshabilitado={claveGuardada}
              onPress={async () => {
                await guardar(evitar, clave);
                setClaveGuardada(true);
              }}
            />
          </View>
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
    gap: Spacing.five,
  },
  seccion: {
    gap: Spacing.three,
  },
  titulo: {
    fontSize: 22,
    lineHeight: 28,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
    borderRadius: Radius.pastilla,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  entrada: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.campo,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  clave: {
    flex: 0,
  },
  mas: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
