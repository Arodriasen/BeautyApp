import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { BoteConEstado } from '@/application/ServicioNeceser';
import { Boton } from '@/components/boton';
import { EstadoCaducidad } from '@/components/estado-caducidad';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { diasEntre } from '@/domain/shared/fechas';
import { useTheme } from '@/hooks/use-theme';
import { colorEstado, formatearFecha } from '@/utils/formato';

interface Props {
  bote: BoteConEstado;
  /** "Bote 1", "Bote 2"… cuando hay más de uno en uso. */
  etiqueta?: string;
  onAbrir: () => void;
  onTerminar: () => void;
  onEliminar: () => void;
}

/**
 * Un bote en uso: su estado, las fechas que importan y una barra con la parte de su vida
 * útil que ya ha pasado desde que se abrió (en el color de su estado).
 */
export function TarjetaBote({ bote, etiqueta, onAbrir, onTerminar, onEliminar }: Props) {
  const tema = useTheme();
  const { unidad, estado } = bote;
  const limite = estado.tipo === 'sinFecha' ? undefined : estado.fechaLimite;

  let progreso: number | undefined;
  if (unidad.fechaApertura && estado.tipo !== 'sinFecha') {
    const total = Math.max(1, diasEntre(unidad.fechaApertura, estado.fechaLimite));
    progreso = Math.min(1, Math.max(0, (total - estado.diasRestantes) / total));
  }

  return (
    <View style={[styles.tarjeta, { backgroundColor: tema.backgroundElement, borderColor: tema.border }]}>
      <View style={styles.cabecera}>
        <EstadoCaducidad estado={estado} abierto={unidad.abierta} />
        {etiqueta && <ThemedText type="marca">{etiqueta}</ThemedText>}
      </View>

      {progreso !== undefined && (
        <View
          style={[styles.barra, { backgroundColor: tema.primarySoft }]}
          accessibilityLabel={`Ha pasado el ${Math.round(progreso * 100)} % de su vida útil`}>
          <View style={[styles.relleno, { width: `${progreso * 100}%`, backgroundColor: tema[colorEstado(estado)] }]} />
        </View>
      )}

      <View style={styles.datos}>
        <Dato titulo="Abierto" valor={unidad.fechaApertura ? formatearFecha(unidad.fechaApertura) : 'Sin abrir'} />
        {limite && <Dato titulo="Tirar antes del" valor={formatearFecha(limite)} />}
        {unidad.caducidadFabricante && !limite && (
          <Dato titulo="Caducidad impresa" valor={formatearFecha(unidad.caducidadFabricante)} />
        )}
      </View>
      {unidad.caducidadFabricante && limite && (
        <ThemedText type="small" themeColor="textSecondary">
          Caducidad impresa: {formatearFecha(unidad.caducidadFabricante)}
        </ThemedText>
      )}

      <View style={styles.acciones}>
        {!unidad.abierta && (
          <View style={styles.flex}>
            <Boton titulo="Lo he abierto" onPress={onAbrir} />
          </View>
        )}
        <View style={styles.flex}>
          <Boton titulo="Terminado" variante="secundario" onPress={onTerminar} />
        </View>
        <Pressable
          onPress={onEliminar}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Eliminar este bote"
          style={[styles.papelera, { borderColor: tema.border }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={tema.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <ThemedText type="marca">{titulo}</ThemedText>
      <ThemedText type="medium">{valor}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tarjeta: {
    borderRadius: Radius.tarjeta,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barra: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    borderRadius: 3,
  },
  datos: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  dato: {
    gap: 2,
  },
  acciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  papelera: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
