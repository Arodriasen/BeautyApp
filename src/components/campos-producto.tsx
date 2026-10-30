import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Campo } from '@/components/campo';
import { SelectorCategoria } from '@/components/selector-categoria';
import { SelectorColorTono } from '@/components/selector-color-tono';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { CATEGORIAS, type Categoria } from '@/domain/productos/Categoria';

export interface ValoresProducto {
  marca: string;
  nombre: string;
  tono: string;
  colorTono?: string;
  categoria?: Categoria;
  /** Texto tal cual lo escribe (se valida al guardar). */
  pao: string;
}

export const esCategoria = (c: string | undefined): c is Categoria => !!c && c in CATEGORIAS;

/** Estado de los campos del producto, compartido por el alta y la edición. */
export function useCamposProducto(inicial: Partial<ValoresProducto> = {}) {
  const [valores, setValores] = useState<ValoresProducto>({
    marca: '',
    nombre: '',
    tono: '',
    pao: '',
    ...inicial,
  });
  const cambiar = (cambios: Partial<ValoresProducto>) => setValores((v) => ({ ...v, ...cambios }));

  /** Devuelve un mensaje de error para mostrar, o los datos listos para el servicio. */
  function validar():
    | { error: string }
    | { datos: { marca: string; nombre: string; tono: string; colorTono?: string; categoria: Categoria; paoMeses?: number } } {
    if (!valores.categoria) return { error: 'Elige una categoría' };
    const pao = valores.pao.trim();
    if (pao && !/^\d+$/.test(pao)) return { error: 'El PAO debe ser un número de meses' };
    return {
      datos: {
        marca: valores.marca,
        nombre: valores.nombre,
        tono: valores.tono,
        colorTono: valores.colorTono,
        categoria: valores.categoria,
        paoMeses: pao ? Number(pao) : undefined,
      },
    };
  }

  return { valores, cambiar, validar };
}

interface Props {
  valores: ValoresProducto;
  cambiar: (cambios: Partial<ValoresProducto>) => void;
  autoFocus?: boolean;
}

export function CamposProducto({ valores, cambiar, autoFocus }: Props) {
  const paoHabitual = valores.categoria ? CATEGORIAS[valores.categoria].paoHabitual : null;
  return (
    <>
      <Campo
        etiqueta="Marca"
        value={valores.marca}
        onChangeText={(marca) => cambiar({ marca })}
        placeholder="Ej.: Maybelline"
        autoFocus={autoFocus}
      />
      <Campo
        etiqueta="Nombre"
        value={valores.nombre}
        onChangeText={(nombre) => cambiar({ nombre })}
        placeholder="Ej.: Lash Sensational"
      />
      <Campo
        etiqueta="Tono (opcional)"
        value={valores.tono}
        onChangeText={(tono) => cambiar({ tono })}
        placeholder="Ej.: 120 Ivory"
      />

      <View style={styles.seccion}>
        <ThemedText type="smallBold">Color del tono (opcional)</ThemedText>
        <SelectorColorTono valor={valores.colorTono} onCambio={(colorTono) => cambiar({ colorTono })} />
      </View>

      <View style={styles.seccion}>
        <ThemedText type="smallBold">Categoría</ThemedText>
        <SelectorCategoria valor={valores.categoria} onCambio={(categoria) => cambiar({ categoria })} />
      </View>

      <Campo
        etiqueta="Meses tras abrir (PAO)"
        value={valores.pao}
        onChangeText={(pao) => cambiar({ pao })}
        keyboardType="number-pad"
        maxLength={2}
        placeholder={paoHabitual ? `Si lo dejas vacío: ${paoHabitual} meses` : 'El número del icono del bote abierto'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  seccion: {
    gap: Spacing.two,
  },
});
