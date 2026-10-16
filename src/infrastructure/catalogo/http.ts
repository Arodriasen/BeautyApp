const TIEMPO_MAXIMO_MS = 8000;

export const USER_AGENT = 'Tocador/1.0 (app personal)';

const PAUSA_REINTENTO_MS = 500;

/**
 * GET que devuelve el JSON, `undefined` si es 404, y lanza en cualquier otro fallo.
 * Los errores 5xx se reintentan una vez: Open Beauty Facts da algún 500 suelto.
 */
export async function getJson<T>(url: string, cabeceras: Record<string, string> = {}): Promise<T | undefined> {
  for (let intento = 1; ; intento++) {
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
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

/** Quita la marca del principio del nombre: "NYX Epic Wear" → "Epic Wear". */
export function quitarMarca(nombre: string, marca: string | undefined): string {
  if (!marca) return nombre.trim();
  const n = nombre.trim();
  if (n.toLowerCase().startsWith(marca.toLowerCase())) {
    const resto = n.slice(marca.length).replace(/^[\s\-–:·,]+/, '');
    if (resto) return resto;
  }
  return n;
}

export function soloHttps(url: string | undefined): string | undefined {
  return url?.startsWith('https://') ? url : undefined;
}
