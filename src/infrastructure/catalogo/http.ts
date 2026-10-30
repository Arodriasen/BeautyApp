import { quitarMarcaDelNombre } from './marcas';

const TIEMPO_MAXIMO_MS = 8000;

export const USER_AGENT = 'Tocador/1.0 (app personal)';

const PAUSA_REINTENTO_MS = 500;

/**
 * GET que devuelve el JSON, `undefined` si es 404, y lanza en cualquier otro fallo.
 * Los errores 5xx se reintentan una vez: Open Beauty Facts da algún 500 suelto.
 */
export async function getJson<T>(
  url: string,
  cabeceras: Record<string, string> = {},
  tiempoMs = TIEMPO_MAXIMO_MS,
): Promise<T | undefined> {
  for (let intento = 1; ; intento++) {
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), tiempoMs);
    try {
      const respuesta = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT, ...cabeceras },
        signal: control.signal,
      });
      if (respuesta.status === 404) return undefined;
      if (respuesta.status >= 500 && intento === 1) {
        await new Promise((r) => setTimeout(r, PAUSA_REINTENTO_MS));
        continue;
      }
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status} en ${url}`);
      return (await respuesta.json()) as T;
    } finally {
      clearTimeout(temporizador);
    }
  }
}

/** Quita la marca (o sus variantes, "Maybelline New York"…) del principio del nombre. */
export function quitarMarca(nombre: string, marca: string | undefined): string {
  return quitarMarcaDelNombre(nombre, marca);
}

export function soloHttps(url: string | undefined): string | undefined {
  return url?.startsWith('https://') ? url : undefined;
}

/** Petición JSON que no lanza por el código HTTP: devuelve estado y cuerpo para que decida quien llama. */
export async function pedirJson(
  url: string,
  opciones: { metodo?: 'GET' | 'POST'; cabeceras?: Record<string, string>; cuerpo?: unknown } = {},
): Promise<{ estado: number; cuerpo: unknown }> {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
  try {
    const respuesta = await fetch(url, {
      method: opciones.metodo ?? 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
        ...(opciones.cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...opciones.cabeceras,
      },
      body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
      signal: control.signal,
    });
    let cuerpo: unknown;
    try {
      cuerpo = await respuesta.json();
    } catch {
      cuerpo = undefined;
    }
    return { estado: respuesta.status, cuerpo };
  } finally {
    clearTimeout(temporizador);
  }
}
