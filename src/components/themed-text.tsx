import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  /**
   * - `title` / `subtitle`: Bodoni en cursiva (titulares).
   * - `marca`: la marca en versalitas espaciadas, como en el envase.
   * - el resto: Jost.
   */
  type?: 'default' | 'medium' | 'title' | 'subtitle' | 'small' | 'smallBold' | 'marca' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[themeColor ?? (type === 'marca' ? 'textSecondary' : 'text')];
  return <Text style={[{ color }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 23,
  },
  medium: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 23,
  },
  small: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: Fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  marca: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 36,
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: Fonts.display,
    fontSize: 27,
    lineHeight: 33,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
