import { Colors, Fonts } from './theme';

/** Cabeceras: título en Bodoni cursiva sobre el fondo rosado, sin sombra. */
export const opcionesCabecera = {
  headerTintColor: Colors.primary,
  headerTitleStyle: { fontFamily: Fonts.display, fontSize: 22, color: Colors.text },
  headerStyle: { backgroundColor: Colors.background },
  headerShadowVisible: false,
} as const;
