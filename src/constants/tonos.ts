/** Paleta de tonos de maquillaje para el punto de color. El nombre sirve de etiqueta accesible. */
export const GRUPOS_TONOS: { grupo: string; tonos: { nombre: string; color: string }[] }[] = [
  {
    grupo: 'Piel y nudes',
    tonos: [
      { nombre: 'Porcelana', color: '#F3D9C9' },
      { nombre: 'Marfil', color: '#EBCBB0' },
      { nombre: 'Beige', color: '#D9AE8C' },
      { nombre: 'Arena', color: '#C69472' },
      { nombre: 'Miel', color: '#A87150' },
      { nombre: 'Canela', color: '#8A5636' },
      { nombre: 'Moca', color: '#5E3A26' },
    ],
  },
  {
    grupo: 'Rosas y rojos',
    tonos: [
      { nombre: 'Rosa palo', color: '#E8B4B8' },
      { nombre: 'Rosa', color: '#E07A95' },
      { nombre: 'Fucsia', color: '#C2185B' },
      { nombre: 'Malva', color: '#B07A8C' },
      { nombre: 'Melocotón', color: '#F4A582' },
      { nombre: 'Coral', color: '#F0806A' },
      { nombre: 'Rojo', color: '#C62828' },
      { nombre: 'Granate', color: '#7B1E2B' },
      { nombre: 'Vino', color: '#5A1530' },
    ],
  },
  {
    grupo: 'Tierras y morados',
    tonos: [
      { nombre: 'Terracota', color: '#B5573B' },
      { nombre: 'Chocolate', color: '#4E2A1E' },
      { nombre: 'Ciruela', color: '#6B2D5C' },
      { nombre: 'Lavanda', color: '#A88BC7' },
    ],
  },
  {
    grupo: 'Ojos y uñas',
    tonos: [
      { nombre: 'Negro', color: '#1D1A1C' },
      { nombre: 'Gris', color: '#7A7476' },
      { nombre: 'Azul marino', color: '#24345E' },
      { nombre: 'Azul', color: '#4A7BC4' },
      { nombre: 'Verde', color: '#3F6B55' },
      { nombre: 'Blanco', color: '#F7F5F2' },
    ],
  },
  {
    grupo: 'Metalizados',
    tonos: [
      { nombre: 'Champán', color: '#E9D3A9' },
      { nombre: 'Dorado', color: '#C9A24A' },
      { nombre: 'Bronce', color: '#9C6B30' },
      { nombre: 'Plata', color: '#BFC3C7' },
    ],
  },
];

const NOMBRES = new Map(GRUPOS_TONOS.flatMap((g) => g.tonos.map((t) => [t.color, t.nombre] as const)));

export function nombreDeColor(color: string): string | undefined {
  return NOMBRES.get(color.toUpperCase());
}
