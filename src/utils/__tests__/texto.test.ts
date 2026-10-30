import { coincide, coincidePorPalabras, normalizar } from '../texto';

it('normaliza tildes y mayúsculas', () => {
  expect(normalizar('Sérum Ácido')).toBe('serum acido');
});

it.each([
  ['Maybelline Lash Sensational Máscara', 'lash maybelline', true],
  ['The Ordinary Sérum', 'serum', true],
  ['MAC Ruby Woo Labial', 'ruby rojo', false],
  ['Cualquier cosa', '   ', true],
])('"%s" con "%s" → %s', (texto, busqueda, esperado) => {
  expect(coincide(texto, busqueda)).toBe(esperado);
});

it.each([
  ['Benefit Gimme Brow Volumizing Eyebrow Gel', 'fit me', false],
  ['Maybelline Fit Me Bronzer', 'fit me', true],
  ['NYX Luv Out Loud Liquid Lipstick', 'nyx lip', true],
  ['Set 5 Fairy Caps Limone', 'fairy limon', true],
])('por palabras: "%s" con "%s" → %s', (texto, busqueda, esperado) => {
  expect(coincidePorPalabras(texto, busqueda)).toBe(esperado);
});
