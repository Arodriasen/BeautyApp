import type { Pao } from '../productos/Pao';
import { diasEntre, soloFecha, sumarMeses } from '../shared/fechas';

export type EstadoCaducidad =
  | { tipo: 'sinFecha' }
  | { tipo: 'vigente'; fechaLimite: Date; diasRestantes: number }
  | { tipo: 'caducaPronto'; fechaLimite: Date; diasRestantes: number }
  | { tipo: 'caducado'; fechaLimite: Date; diasRestantes: number };

export interface DatosUnidad {
  id: string;
  productoId: string;
  fechaCompra?: Date;
  fechaApertura?: Date;
  /** Fecha de caducidad impresa (la que tienen los productos que duran menos de 30 meses). */
  caducidadFabricante?: Date;
  fechaTerminado?: Date;
}

/** Un bote concreto de un producto: puede haber varios del mismo (uno abierto y otro de repuesto). */
export class Unidad {
  static readonly DIAS_AVISO = 30;

  readonly id: string;
  readonly productoId: string;
  private _fechaCompra?: Date;
  private _fechaApertura?: Date;
  private _caducidadFabricante?: Date;
  private _fechaTerminado?: Date;

  constructor(datos: DatosUnidad) {
    this.id = datos.id;
    this.productoId = datos.productoId;
    this._fechaCompra = datos.fechaCompra && soloFecha(datos.fechaCompra);
    this._fechaApertura = datos.fechaApertura && soloFecha(datos.fechaApertura);
    this._caducidadFabricante = datos.caducidadFabricante && soloFecha(datos.caducidadFabricante);
    this._fechaTerminado = datos.fechaTerminado && soloFecha(datos.fechaTerminado);
  }

  get fechaCompra() {
    return this._fechaCompra;
  }
  get caducidadFabricante() {
    return this._caducidadFabricante;
  }
  get fechaApertura() {
    return this._fechaApertura;
  }
  get fechaTerminado() {
    return this._fechaTerminado;
  }
  get abierta() {
    return this._fechaApertura !== undefined;
  }
  get terminada() {
    return this._fechaTerminado !== undefined;
  }

  abrir(fecha: Date): void {
    if (this.abierta) throw new Error('Esta unidad ya está abierta');
    this._fechaApertura = soloFecha(fecha);
  }

  /**
   * Corrige las fechas de un bote (p. ej. si se marcó como abierto el día equivocado).
   * Quitar la apertura lo deja "sin abrir". No toca la fecha de terminado.
   */
  corregirFechas(fechas: Pick<DatosUnidad, 'fechaCompra' | 'fechaApertura' | 'caducidadFabricante'>, hoy: Date): void {
    const apertura = fechas.fechaApertura && soloFecha(fechas.fechaApertura);
    if (apertura && apertura > soloFecha(hoy)) throw new Error('La fecha de apertura no puede ser futura');
    if (apertura && this._fechaTerminado && apertura > this._fechaTerminado) {
      throw new Error('La fecha de apertura no puede ser posterior a la de terminado');
    }
    this._fechaApertura = apertura;
    this._fechaCompra = fechas.fechaCompra && soloFecha(fechas.fechaCompra);
    this._caducidadFabricante = fechas.caducidadFabricante && soloFecha(fechas.caducidadFabricante);
  }

  terminar(fecha: Date): void {
    if (this.terminada) throw new Error('Esta unidad ya está terminada');
    this._fechaTerminado = soloFecha(fecha);
  }

  /**
   * Fecha a partir de la cual conviene tirarla: la más temprana entre
   * apertura + PAO y la caducidad del fabricante.
   */
  fechaLimite(pao: Pao | undefined): Date | undefined {
    const porPao = this._fechaApertura && pao ? sumarMeses(this._fechaApertura, pao.meses) : undefined;
    const candidatas = [porPao, this._caducidadFabricante].filter((f): f is Date => f !== undefined);
    if (candidatas.length === 0) return undefined;
    return new Date(Math.min(...candidatas.map((f) => f.getTime())));
  }

  estado(pao: Pao | undefined, hoy: Date, diasAviso = Unidad.DIAS_AVISO): EstadoCaducidad {
    const fechaLimite = this.fechaLimite(pao);
    if (!fechaLimite) return { tipo: 'sinFecha' };

    const diasRestantes = diasEntre(hoy, fechaLimite);
    if (diasRestantes < 0) return { tipo: 'caducado', fechaLimite, diasRestantes };
    if (diasRestantes <= diasAviso) return { tipo: 'caducaPronto', fechaLimite, diasRestantes };
    return { tipo: 'vigente', fechaLimite, diasRestantes };
  }
}
