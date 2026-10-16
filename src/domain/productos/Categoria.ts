export type Familia = 'maquillaje' | 'cuidado' | 'otros';

export const CATEGORIAS = {
  // Maquillaje
  base: { nombre: 'Base', familia: 'maquillaje', paoHabitual: 12 },
  corrector: { nombre: 'Corrector', familia: 'maquillaje', paoHabitual: 12 },
  polvos: { nombre: 'Polvos', familia: 'maquillaje', paoHabitual: 24 },
  colorete: { nombre: 'Colorete', familia: 'maquillaje', paoHabitual: 24 },
  bronceador: { nombre: 'Bronceador', familia: 'maquillaje', paoHabitual: 24 },
  iluminador: { nombre: 'Iluminador', familia: 'maquillaje', paoHabitual: 24 },
  prebase: { nombre: 'Prebase', familia: 'maquillaje', paoHabitual: 12 },
  sombras: { nombre: 'Sombras', familia: 'maquillaje', paoHabitual: 24 },
  delineador: { nombre: 'Delineador', familia: 'maquillaje', paoHabitual: 6 },
  mascara: { nombre: 'Máscara de pestañas', familia: 'maquillaje', paoHabitual: 6 },
  cejas: { nombre: 'Cejas', familia: 'maquillaje', paoHabitual: 12 },
  labial: { nombre: 'Labial', familia: 'maquillaje', paoHabitual: 18 },
  gloss: { nombre: 'Gloss', familia: 'maquillaje', paoHabitual: 12 },
  perfilador: { nombre: 'Perfilador de labios', familia: 'maquillaje', paoHabitual: 24 },
  fijador: { nombre: 'Fijador', familia: 'maquillaje', paoHabitual: 12 },
  // Cuidado
  limpiador: { nombre: 'Limpiador', familia: 'cuidado', paoHabitual: 12 },
  desmaquillante: { nombre: 'Desmaquillante', familia: 'cuidado', paoHabitual: 12 },
  tonico: { nombre: 'Tónico', familia: 'cuidado', paoHabitual: 12 },
  serum: { nombre: 'Sérum', familia: 'cuidado', paoHabitual: 6 },
  hidratante: { nombre: 'Hidratante', familia: 'cuidado', paoHabitual: 12 },
  contornoOjos: { nombre: 'Contorno de ojos', familia: 'cuidado', paoHabitual: 6 },
  protectorSolar: { nombre: 'Protector solar', familia: 'cuidado', paoHabitual: 12 },
  mascarilla: { nombre: 'Mascarilla', familia: 'cuidado', paoHabitual: 12 },
  exfoliante: { nombre: 'Exfoliante', familia: 'cuidado', paoHabitual: 12 },
  corporal: { nombre: 'Cuidado corporal', familia: 'cuidado', paoHabitual: 12 },
  cabello: { nombre: 'Cabello', familia: 'cuidado', paoHabitual: 12 },
  unas: { nombre: 'Uñas', familia: 'cuidado', paoHabitual: 12 },
  // Otros
  perfume: { nombre: 'Perfume', familia: 'otros', paoHabitual: 36 },
  accesorio: { nombre: 'Accesorio', familia: 'otros', paoHabitual: null },
  otro: { nombre: 'Otro', familia: 'otros', paoHabitual: null },
} as const satisfies Record<
  string,
  { nombre: string; familia: Familia; paoHabitual: number | null }
>;

export type Categoria = keyof typeof CATEGORIAS;
