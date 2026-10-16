import type { Unidad } from '@/domain/inventario/Unidad';
import type { Producto } from '@/domain/productos/Producto';
import { aLas, sumarDias } from '@/domain/shared/fechas';

export interface AjustesAvisos {
  activados: boolean;
  /** Días de antelación del primer aviso. */
  diasAntes: number;
  hora: number;
  minuto: number;
  /** Un aviso los domingos con lo que caduca esa semana. */
  resumenSemanal: boolean;
}

export const AJUSTES_POR_DEFECTO: AjustesAvisos = {
  activados: true,
  diasAntes: 7,
  hora: 10,
  minuto: 0,
  resumenSemanal: false,
};

/** Android limita las alarmas por app; con los más próximos basta (se replanifica a menudo). */
export const MAX_AVISOS = 50;

export interface AvisoPlanificado {
  id: string;
  fecha: Date;
  titulo: string;
  cuerpo: string;
  /** Si el aviso es de un solo producto, para abrir su ficha al pulsarlo. */
  productoId?: string;
}

export interface BoteEnUso {
  producto: Producto;
  unidad: Unidad;
}

type Tipo = 'previo' | 'dia';

const nombreDe = (p: Producto) => `${p.marca} ${p.nombre}${p.tono ? ` (${p.tono})` : ''}`;

const ddmm = (f: Date) => `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`;

function enumerar(productos: Producto[]): string {
  const nombres = productos.map(nombreDe);
  if (nombres.length <= 3) return nombres.join(', ');
  return `${nombres.slice(0, 3).join(', ')} y ${nombres.length - 3} más`;
}

function redactar(tipo: Tipo, productos: Producto[], limite: Date, diasAntes: number) {
  const uno = productos.length === 1;
  const plazo = diasAntes === 1 ? 'mañana' : `en ${diasAntes} días`;
  if (tipo === 'previo') {
    return uno
      ? { titulo: `Caduca ${plazo}`, cuerpo: `${nombreDe(productos[0])} caduca el ${ddmm(limite)}.` }
      : { titulo: `${productos.length} productos caducan ${plazo}`, cuerpo: enumerar(productos) };
  }
  return uno
    ? { titulo: 'Hoy caduca', cuerpo: `${nombreDe(productos[0])}: toca renovarlo.` }
    : { titulo: `Hoy caducan ${productos.length} productos`, cuerpo: enumerar(productos) };
}

/**
 * Decide qué notificaciones programar. Por cada bote en uso con fecha límite: un aviso
 * `diasAntes` días antes y otro el mismo día, a la hora elegida. Los que coinciden
 * en el mismo momento se agrupan en uno solo. Lo que ya ha pasado no se programa.
 */
export function planificarAvisos(botes: BoteEnUso[], ajustes: AjustesAvisos, ahora: Date): AvisoPlanificado[] {
  if (!ajustes.activados) return [];

  const conLimite = botes.flatMap(({ producto, unidad }) => {
    const limite = unidad.fechaLimite(producto.paoEfectivo);
    return limite ? [{ producto, limite }] : [];
  });

  const grupos = new Map<string, { tipo: Tipo; fecha: Date; limite: Date; productos: Producto[] }>();
  const anadir = (tipo: Tipo, fecha: Date, limite: Date, producto: Producto) => {
    if (fecha <= ahora) return;
    const clave = `${tipo}-${fecha.getTime()}`;
    const grupo = grupos.get(clave) ?? { tipo, fecha, limite, productos: [] };
    if (!grupo.productos.some((p) => p.id === producto.id)) grupo.productos.push(producto);
    grupos.set(clave, grupo);
  };

  for (const { producto, limite } of conLimite) {
    if (ajustes.diasAntes > 0) {
      anadir('previo', aLas(sumarDias(limite, -ajustes.diasAntes), ajustes.hora, ajustes.minuto), limite, producto);
    }
    anadir('dia', aLas(limite, ajustes.hora, ajustes.minuto), limite, producto);
  }

  const avisos: AvisoPlanificado[] = [...grupos.entries()].map(([clave, g]) => ({
    id: clave,
    fecha: g.fecha,
    ...redactar(g.tipo, g.productos, g.limite, ajustes.diasAntes),
    productoId: g.productos.length === 1 ? g.productos[0].id : undefined,
  }));

  if (ajustes.resumenSemanal) avisos.push(...resumenesSemanales(conLimite, ajustes, ahora));

  return avisos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime()).slice(0, MAX_AVISOS);
}

const SEMANAS_RESUMEN = 8;

function resumenesSemanales(
  conLimite: { producto: Producto; limite: Date }[],
  ajustes: AjustesAvisos,
  ahora: Date,
): AvisoPlanificado[] {
  const hoy = sumarDias(ahora, 0);
  let domingo = sumarDias(hoy, (7 - hoy.getDay()) % 7);
  if (aLas(domingo, ajustes.hora, ajustes.minuto) <= ahora) domingo = sumarDias(domingo, 7);

  const avisos: AvisoPlanificado[] = [];
  for (let i = 0; i < SEMANAS_RESUMEN; i++, domingo = sumarDias(domingo, 7)) {
    const finSemana = sumarDias(domingo, 7);
    const productos = conLimite.filter(({ limite }) => limite >= domingo && limite < finSemana).map((b) => b.producto);
    const unicos = [...new Map(productos.map((p) => [p.id, p])).values()];
    if (unicos.length === 0) continue;
    avisos.push({
      id: `semana-${domingo.getTime()}`,
      fecha: aLas(domingo, ajustes.hora, ajustes.minuto),
      titulo: unicos.length === 1 ? 'Esta semana caduca 1 producto' : `Esta semana caducan ${unicos.length} productos`,
      cuerpo: enumerar(unicos),
      productoId: unicos.length === 1 ? unicos[0].id : undefined,
    });
  }
  return avisos;
}
