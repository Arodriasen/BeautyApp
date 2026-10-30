import type { AnalizadorIngredientes } from '@/application/ingredientes/puertos';
import type { Ean } from '@/domain/productos/Ean';
import type { AnalisisIngredientes, NivelSeguridad } from '@/domain/productos/Ingredientes';

import { pedirJson } from './http';

const BASE = 'https://inciapi.com/v1';

const NIVELES: NivelSeguridad[] = ['safe', 'low_risk', 'moderate', 'high_risk', 'hazardous'];

interface RespuestaSeguridad {
  overallSafetyScore?: number;
  safetyLevel?: string;
  pregnancySafe?: boolean | null;
  allergenFlags?: (string | { inciName?: string; name?: string })[];
  parsedIngredients?: { inciName?: string; isAllergen?: boolean }[];
}

function aAnalisis(r: RespuestaSeguridad): AnalisisIngredientes {
  const banderas = (r.allergenFlags ?? [])
    .map((a) => (typeof a === 'string' ? a : (a.inciName ?? a.name)))
    .filter((a): a is string => !!a);
  const marcados = (r.parsedIngredients ?? []).filter((i) => i.isAllergen && i.inciName).map((i) => i.inciName!);
  return {
    puntuacion: typeof r.overallSafetyScore === 'number' ? r.overallSafetyScore : undefined,
    nivel: NIVELES.includes(r.safetyLevel as NivelSeguridad) ? (r.safetyLevel as NivelSeguridad) : undefined,
    alergenos: [...new Set([...banderas, ...marcados])],
    aptoEmbarazo: typeof r.pregnancySafe === 'boolean' ? r.pregnancySafe : undefined,
    fecha: new Date(),
  };
}

/** Traduce los errores de la API a mensajes que se pueden enseñar tal cual. */
function errorDe(estado: number, cuerpo: unknown): Error {
  const codigo = (cuerpo as { code?: string } | undefined)?.code;
  if (estado === 401) return new Error('La clave de INCI API no es válida. Revísala en Ajustes → Ingredientes.');
  if (estado === 429 && codigo === 'quota_exhausted') return new Error('Se han agotado los análisis gratuitos de este mes.');
  if (estado === 429) return new Error('Demasiadas consultas seguidas. Prueba de nuevo en un minuto.');
  if (codigo === 'invalid_inci_list') return new Error('La lista de ingredientes está vacía o es demasiado larga.');
  return new Error(`INCI API ha respondido con un error (${estado}${codigo ? `, ${codigo}` : ''}).`);
}

/** INCI API (https://inciapi.com): análisis de seguridad. Clave gratuita, 2.000 análisis al mes. */
export class InciApi implements AnalizadorIngredientes {
  async porCodigo(ean: Ean, clave: string) {
    const { estado, cuerpo } = await pedirJson(`${BASE}/products/${ean.valor}/safety`, {
      cabeceras: { 'X-API-Key': clave },
    });
    // 404 = no tiene el producto o no tiene su lista (y no gasta consulta).
    if (estado === 404) return undefined;
    if (estado !== 200) throw errorDe(estado, cuerpo);
    const r = cuerpo as RespuestaSeguridad;
    const ingredientes = (r.parsedIngredients ?? []).map((i) => i.inciName).filter((n): n is string => !!n);
    return { ingredientes, analisis: aAnalisis(r) };
  }

  async analizar(ingredientes: string[], clave: string): Promise<AnalisisIngredientes> {
    const { estado, cuerpo } = await pedirJson(`${BASE}/analyze`, {
      metodo: 'POST',
      cabeceras: { 'X-API-Key': clave },
      cuerpo: { inci: ingredientes.slice(0, 200) },
    });
    if (estado !== 200) throw errorDe(estado, cuerpo);
    // La respuesta puede venir plana o dentro de `analysis`.
    const r = (cuerpo as { analysis?: RespuestaSeguridad }).analysis ?? (cuerpo as RespuestaSeguridad);
    return aAnalisis(r);
  }
}
