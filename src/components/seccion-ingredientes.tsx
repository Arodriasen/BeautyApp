import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { esAlergeno, ingredientesEvitados, type NivelSeguridad } from '@/domain/productos/Ingredientes';
import type { Producto } from '@/domain/productos/Producto';
import { useIngredientes } from '@/hooks/use-neceser';
import { useTheme } from '@/hooks/use-theme';
import { formatearFecha } from '@/utils/formato';

const NIVEL: Record<NivelSeguridad, string> = {
  safe: 'Seguro',
  low_risk: 'Riesgo bajo',
  moderate: 'Riesgo moderado',
  high_risk: 'Riesgo alto',
  hazardous: 'Peligroso',
};

/** Cuántos ingredientes se ven sin pulsar "Ver todos". */
const VISIBLES = 12;

interface Props {
  producto: Producto;
  evitar: string[];
  tieneClave: boolean;
  onCambio: () => void;
}

export function SeccionIngredientes({ producto, evitar, tieneClave, onCambio }: Props) {
  const tema = useTheme();
  const servicio = useIngredientes();
  const [ocupado, setOcupado] = useState<'buscar' | 'analizar'>();
  const [mensaje, setMensaje] = useState<{ texto: string; error?: boolean }>();
  const [verTodos, setVerTodos] = useState(false);

  const lista = producto.ingredientes ?? [];
  const evitados = ingredientesEvitados(lista, evitar);
  const alergenos = producto.analisis?.alergenos ?? [];
  const editar = () => router.push({ pathname: '/producto/ingredientes', params: { id: producto.id } });

  async function ejecutar(accion: 'buscar' | 'analizar') {
    setOcupado(accion);
    setMensaje(undefined);
    try {
      if (accion === 'buscar') {
        const r = await servicio.buscarLista(producto.id);
        if (r === 'noEncontrados') {
          setMensaje({ texto: 'No hemos encontrado su lista. Puedes copiarla de la caja.' });
        }
      } else {
        await servicio.analizar(producto.id);
      }
      onCambio();
    } catch (e) {
      setMensaje({ texto: e instanceof Error ? e.message : String(e), error: true });
    } finally {
      setOcupado(undefined);
    }
  }

  return (
    <View style={styles.seccion}>
      <View style={styles.cabecera}>
        <ThemedText type="subtitle" style={styles.titulo}>
          Ingredientes
        </ThemedText>
        {lista.length > 0 && (
          <Pressable onPress={editar} hitSlop={8}>
            <ThemedText type="small" style={{ color: tema.primary, fontFamily: Fonts.semibold }}>
              Editar
            </ThemedText>
          </Pressable>
        )}
      </View>

      {evitados.length > 0 && (
        <View style={[styles.aviso, { backgroundColor: tema.caducadoSoft }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={tema.caducado} />
          <ThemedText type="small" style={[styles.flex, { color: tema.caducado }]}>
            Contiene {evitados.length === 1 ? 'un ingrediente' : `${evitados.length} ingredientes`} que evitas:{' '}
            <ThemedText type="smallBold" style={{ color: tema.caducado }}>
              {evitados.join(', ')}
            </ThemedText>
          </ThemedText>
        </View>
      )}

      {producto.analisis && (
        <View style={[styles.tarjeta, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
          <View style={styles.fila}>
            {producto.analisis.puntuacion !== undefined && (
              <ThemedText style={[styles.nota, { color: tema.primary }]}>
                {String(Math.round(producto.analisis.puntuacion * 10) / 10).replace('.', ',')}
                <ThemedText type="small" themeColor="textSecondary">
                  {' '}
                  / 10
                </ThemedText>
              </ThemedText>
            )}
            <View style={styles.flex}>
              {producto.analisis.nivel && <ThemedText type="medium">{NIVEL[producto.analisis.nivel]}</ThemedText>}
              <ThemedText type="small" themeColor="textSecondary">
                Analizado el {formatearFecha(producto.analisis.fecha)} con INCI API
              </ThemedText>
            </View>
          </View>
          <Dato
            icono="flower-outline"
            titulo="Alérgenos (UE)"
            valor={alergenos.length ? alergenos.join(', ') : 'Ninguno'}
            color={alergenos.length ? tema.caducaPronto : tema.vigente}
          />
          <Dato
            icono="human-pregnant"
            titulo="Embarazo"
            valor={
              producto.analisis.aptoEmbarazo === undefined
                ? 'Sin datos'
                : producto.analisis.aptoEmbarazo
                  ? 'Apto'
                  : 'No recomendado'
            }
            color={producto.analisis.aptoEmbarazo === false ? tema.caducado : tema.text}
          />
        </View>
      )}

      {lista.length > 0 ? (
        <View style={styles.chips}>
          {(verTodos ? lista : lista.slice(0, VISIBLES)).map((ingrediente) => {
            const evitado = evitados.includes(ingrediente);
            const alergeno = !evitado && esAlergeno(ingrediente, alergenos);
            return (
              <View
                key={ingrediente}
                style={[
                  styles.chip,
                  {
                    backgroundColor: evitado ? tema.caducadoSoft : alergeno ? tema.caducaProntoSoft : tema.backgroundElement,
                    borderColor: evitado ? tema.caducado : alergeno ? tema.caducaPronto : tema.border,
                  },
                ]}>
                <ThemedText
                  type="small"
                  style={{ color: evitado ? tema.caducado : alergeno ? tema.caducaPronto : tema.text }}>
                  {ingrediente}
                </ThemedText>
              </View>
            );
          })}
          {lista.length > VISIBLES && (
            <Pressable onPress={() => setVerTodos(!verTodos)} hitSlop={8} style={styles.chip}>
              <ThemedText type="small" style={{ color: tema.primary, fontFamily: Fonts.semibold }}>
                {verTodos ? 'Ver menos' : `Ver los ${lista.length}`}
              </ThemedText>
            </Pressable>
          )}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Todavía no tiene la lista de ingredientes.
        </ThemedText>
      )}

      {mensaje && (
        <ThemedText type="small" style={{ color: mensaje.error ? tema.danger : tema.textSecondary }}>
          {mensaje.texto}
        </ThemedText>
      )}

      {ocupado ? (
        <ActivityIndicator color={tema.primary} />
      ) : lista.length === 0 ? (
        <View style={styles.botones}>
          {producto.ean && (
            <View style={styles.flex}>
              <Boton titulo="Buscarlos" variante="secundario" onPress={() => ejecutar('buscar')} />
            </View>
          )}
          <View style={styles.flex}>
            <Boton titulo="Escribirlos" variante="secundario" onPress={editar} />
          </View>
        </View>
      ) : tieneClave ? (
        <Boton
          titulo={producto.analisis ? 'Volver a analizar' : 'Analizar con INCI API'}
          variante="secundario"
          onPress={() => ejecutar('analizar')}
        />
      ) : (
        <Pressable onPress={() => router.push('/ajustes/ingredientes')} hitSlop={8}>
          <ThemedText type="small" style={{ color: tema.primary }}>
            Activa el análisis de seguridad en Ajustes → Ingredientes
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

function Dato(props: {
  icono: keyof typeof MaterialCommunityIcons.glyphMap;
  titulo: string;
  valor: string;
  color: string;
}) {
  const tema = useTheme();
  return (
    <View style={styles.fila}>
      <MaterialCommunityIcons name={props.icono} size={18} color={tema.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary">
        {props.titulo}
      </ThemedText>
      <ThemedText type="small" style={[styles.flex, styles.valor, { color: props.color }]}>
        {props.valor}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  seccion: {
    gap: Spacing.three,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  titulo: {
    fontSize: 22,
    lineHeight: 28,
  },
  aviso: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderRadius: Radius.tarjeta,
    padding: Spacing.three,
  },
  tarjeta: {
    borderRadius: Radius.tarjeta,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two + Spacing.one,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nota: {
    fontFamily: Fonts.display,
    fontSize: 36,
    lineHeight: 42,
  },
  valor: {
    textAlign: 'right',
    fontFamily: Fonts.medium,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Radius.pastilla,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  botones: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
