import { Colors } from '@/constants/theme';

/** La app es siempre clara: una sola paleta. Se mantiene como hook por si algún día cambia. */
export function useTheme() {
  return Colors;
}
