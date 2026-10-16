import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AjustesAvisos, AvisoPlanificado } from '@/application/avisos/PlanificadorAvisos';
import type { EstadoPermiso } from '@/application/avisos/puertos';
import { Boton } from '@/components/boton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useAvisos } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';
import { elegirHora } from '@/utils/elegir-fecha';
import { formatearFecha } from '@/utils/formato';

const ANTELACIONES = [3, 7, 15];

const hhmm = (hora: number, minuto: number) => `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;

export default function AvisosScreen() {
  const avisos = useAvisos();
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const [ajustes, setAjustes] = useState<AjustesAvisos>();
  const [proximo, setProximo] = useState<AvisoPlanificado | null>(null);
  const [permiso, setPermiso] = useState<EstadoPermiso>('concedido');
  const [pruebaEnviada, setPruebaEnviada] = useState(false);
  const [error, setError] = useState<string>();

  const recargar = useCallback(async () => {
    const [a, plan, p] = await Promise.all([avisos.obtenerAjustes(), avisos.planificar(), avisos.estadoPermiso()]);
    setAjustes(a);
    setProximo(plan[0] ?? null);
    setPermiso(p);
  }, [avisos]);

  // Al volver de los ajustes del móvil el permiso puede haber cambiado.
  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  if (!ajustes) return <ThemedView style={styles.flex} />;

  async function cambiar(cambios: Partial<AjustesAvisos>) {
    const nuevos = { ...ajustes!, ...cambios };
    setAjustes(nuevos);
    setError(undefined);
    try {
      await avisos.guardarAjustes(nuevos);
    } catch (e) {
      setError(`No se han podido programar los avisos: ${e instanceof Error ? e.message : String(e)}`);
    }
    await recargar();
  }

  async function cambiarHora() {
    const h = await elegirHora(ajustes!.hora, ajustes!.minuto);
    if (h) await cambiar(h);
  }

  async function probar() {
    setError(undefined);
    try {
      await avisos.probar();
      setPruebaEnviada(true);
    } catch (e) {
      setError(`No se ha podido enviar el aviso de prueba: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const activos = ajustes.activados;
  const sinPermiso = permiso !== 'concedido';

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + Spacing.four }]}>
        <View style={styles.fila}>
          <View style={styles.flex}>
            <ThemedText>Avisos de caducidad</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Te avisa antes de que caduque un producto abierto y el mismo día.
            </ThemedText>
          </View>
          <Switch
            value={activos}
            onValueChange={(v) => cambiar({ activados: v })}
            trackColor={{ true: tema.primary }}
            thumbColor={activos ? tema.onPrimary : undefined}
          />
        </View>

        {sinPermiso && (
          <ThemedView type="backgroundElement" style={styles.tarjeta}>
            <ThemedText type="small">
              El móvil no deja a la app enviar notificaciones. Actívalas en los ajustes del móvil.
            </ThemedText>
            <Boton titulo="Abrir ajustes del móvil" variante="secundario" onPress={() => Linking.openSettings()} />
          </ThemedView>
        )}

        <View style={[styles.seccion, !activos && styles.apagado]} pointerEvents={activos ? 'auto' : 'none'}>
          <ThemedText type="smallBold">Avisar con antelación</ThemedText>
          <View style={styles.chips}>
            {ANTELACIONES.map((dias) => {
              const elegido = ajustes.diasAntes === dias;
              return (
                <Pressable
                  key={dias}
                  onPress={() => cambiar({ diasAntes: dias })}
                  accessibilityState={{ selected: elegido }}
                  style={[
                    styles.chip,
                    {
                      borderColor: elegido ? tema.primary : tema.border,
                      backgroundColor: elegido ? tema.primarySoft : tema.backgroundElement,
                    },
                  ]}>
                  <ThemedText style={{ color: elegido ? tema.primary : tema.text }}>{dias} días</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText type="smallBold">Hora de los avisos</ThemedText>
          <Pressable
            onPress={cambiarHora}
            style={[styles.hora, { borderColor: tema.border, backgroundColor: tema.backgroundElement }]}>
            <ThemedText>{hhmm(ajustes.hora, ajustes.minuto)}</ThemedText>
          </Pressable>

          <View style={styles.fila}>
            <View style={styles.flex}>
              <ThemedText>Resumen semanal</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Los domingos, lo que caduca esa semana.
              </ThemedText>
            </View>
            <Switch
              value={ajustes.resumenSemanal}
              onValueChange={(v) => cambiar({ resumenSemanal: v })}
              trackColor={{ true: tema.primary }}
              thumbColor={ajustes.resumenSemanal ? tema.onPrimary : undefined}
            />
          </View>

          <ThemedView type="backgroundElement" style={styles.tarjeta}>
            <ThemedText type="smallBold">Próximo aviso</ThemedText>
            {proximo ? (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatearFecha(proximo.fecha)} a las {hhmm(proximo.fecha.getHours(), proximo.fecha.getMinutes())}
                </ThemedText>
                <ThemedText>{proximo.titulo}</ThemedText>
                <ThemedText type="small">{proximo.cuerpo}</ThemedText>
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No hay ninguno pendiente. Los avisos se crean para los productos abiertos o con caducidad impresa.
              </ThemedText>
            )}
          </ThemedView>

          <Boton titulo="Enviar un aviso de prueba" variante="secundario" onPress={probar} deshabilitado={sinPermiso} />
          {error && (
            <ThemedText type="small" style={{ color: tema.danger }}>
              {error}
            </ThemedText>
          )}
          {pruebaEnviada && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.centrado}>
              Llegará en unos segundos.
            </ThemedText>
          )}
        </View>
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
    gap: Spacing.four,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  seccion: {
    gap: Spacing.three,
  },
  apagado: {
    opacity: 0.4,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.pastilla,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  hora: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.campo,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + Spacing.one,
  },
  tarjeta: {
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  centrado: {
    textAlign: 'center',
  },
});
