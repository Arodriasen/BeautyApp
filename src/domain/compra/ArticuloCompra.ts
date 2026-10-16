import { soloFecha } from '../shared/fechas';

export interface DatosArticuloCompra {
  id: string;
  /** Texto que se ve en la lista. Si viene de un producto, es una copia de su nombre. */
  descripcion: string;
  /** Si es un producto del neceser (para recomprarlo). */
  productoId?: string;
  nota?: string;
  creadoEl: Date;
  compradoEl?: Date;
}

/** Una línea de la lista de la compra. */
export class ArticuloCompra {
  readonly id: string;
  readonly descripcion: string;
  readonly productoId?: string;
  readonly nota?: string;
  readonly creadoEl: Date;
  private _compradoEl?: Date;

  constructor(datos: DatosArticuloCompra) {
    const descripcion = datos.descripcion.trim();
    if (!descripcion) throw new Error('Escribe qué quieres comprar');
    this.id = datos.id;
    this.descripcion = descripcion;
    this.productoId = datos.productoId;
    this.nota = datos.nota?.trim() || undefined;
    this.creadoEl = datos.creadoEl;
    this._compradoEl = datos.compradoEl && soloFecha(datos.compradoEl);
  }

  get compradoEl() {
    return this._compradoEl;
  }
  get comprado() {
    return this._compradoEl !== undefined;
  }

  marcarComprado(fecha: Date): void {
    this._compradoEl = soloFecha(fecha);
  }

  desmarcar(): void {
    this._compradoEl = undefined;
  }
}
