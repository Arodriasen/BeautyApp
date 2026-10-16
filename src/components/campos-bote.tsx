import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { CampoFecha } from '@/components/campo';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ValorBote {
  caducidadFabricante?: Date;
  fechaApertura?: Date;
}

/** Estado de los campos de un bote: caducidad impresa y si ya está abierto (y desde cuándo). */
export function useCamposBote() {
  const [caducidad, setCaducidad] = useState<Date>();
  const [abierto, setAbierto] = useState(false);
  const [fechaApertura, setFechaApertura] = useState<Date>(new Date());

  const valor: ValorBote = {
    caducidadFabricante: caducidad,
    fechaApertura: abierto ? fechaApertura : undefined,
  };
  const props = { caducidad, setCaducidad, abierto, setAbierto, fechaApertura, setFechaApertura };
  return { valor, props };
}

type Props = ReturnType<typeof useCamposBote>['props'];

export function CamposBote({ caducidad, setCaducidad, abierto, setAbierto, fechaApertura, setFechaApertura }: Props) {
  const tema = useTheme();
  return (
    <>
      <CampoFecha
        etiqueta="Caducidad impresa (opcional)"
        valor={caducidad}
        onCambio={setCaducidad}
        minimumDate={new Date(2000, 0, 1)}
      />

      <View style={styles.interruptor}>
        <ThemedText>Ya está abierto</ThemedText>
        <Switch
          value={abierto}
          onValueChange={setAbierto}
          trackColor={{ true: tema.primary }}
          thumbColor={abierto ? tema.onPrimary : undefined}
        />
      </View>
      {abierto && (
        <CampoFecha
          etiqueta="Abierto el"
          valor={fechaApertura}
          onCambio={(f) => f && setFechaApertura(f)}
          opcional={false}
          maximumDate={new Date()}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  interruptor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
