import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { Fonts } from '@/constants/theme';

interface Props {
  /** Texto dentro del bote, p. ej. "6M". Sin texto, solo el bote. */
  meses?: string;
  color: string;
  tamano?: number;
}

/** El símbolo del bote abierto del PAO, el que viene impreso en los envases. */
export function BotePao({ meses, color, tamano = 20 }: Props) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 32 32" fill="none">
      <Path d="M7 13h18v12a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V13Z" stroke={color} strokeWidth={2} />
      <Path d="M8 9.5 22.5 5.2l1 3.4L9 12.9Z" stroke={color} strokeWidth={2} />
      {meses && (
        <SvgText x={16} y={24.5} textAnchor="middle" fontSize={8.5} fontFamily={Fonts.semibold} fill={color}>
          {meses}
        </SvgText>
      )}
    </Svg>
  );
}
