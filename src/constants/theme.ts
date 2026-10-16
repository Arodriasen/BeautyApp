/**
 * Estilo "Tocador": revista de moda sobre el tocador. Fondo rosa empolvado muy suave,
 * tinta ciruela y un tono baya para lo importante. La app es siempre clara.
 */

export const Colors = {
  text: '#2A1A21',
  textSecondary: '#8A7179',
  /** Fondo de las pantallas. */
  background: '#FCF6F7',
  /** Tarjetas, filas y campos sobre el fondo. */
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#F5E1E8',
  border: '#EEDDE3',
  primary: '#9E2B5B',
  onPrimary: '#FFFFFF',
  primarySoft: '#F5E1E8',
  danger: '#B3261E',
  vigente: '#4F7A5A',
  caducaPronto: '#B86E14',
  caducaProntoSoft: '#FBEAD6',
  caducado: '#B3261E',
  caducadoSoft: '#F8DCDA',
  neutro: '#A8949B',
} as const;

export type ThemeColor = keyof typeof Colors;

/**
 * Familias cargadas en el layout raíz. En Android, con fuentes propias, el peso se elige
 * por familia (no con `fontWeight`), así que cada peso tiene la suya.
 */
export const Fonts = {
  /** Títulos: Bodoni Moda en cursiva. */
  display: 'BodoniModa_600SemiBold_Italic',
  /** Iniciales de las miniaturas y números grandes. */
  displayRecta: 'BodoniModa_600SemiBold',
  body: 'Jost_400Regular',
  medium: 'Jost_500Medium',
  semibold: 'Jost_600SemiBold',
  mono: 'monospace',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  /** Tarjetas y filas de lista. */
  tarjeta: 18,
  /** Campos de texto. */
  campo: 14,
  /** Botones, chips y etiquetas: completamente redondeados. */
  pastilla: 999,
} as const;
