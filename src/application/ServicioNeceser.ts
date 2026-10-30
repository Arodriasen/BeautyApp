import { Unidad, type EstadoCaducidad } from '@/domain/inventario/Unidad';
import type { UnidadRepositorio } from '@/domain/inventario/UnidadRepositorio';
import type { Categoria } from '@/domain/productos/Categoria';
import { Ean } from '@/domain/productos/Ean';
import { Pao } from '@/domain/productos/Pao';
import { Producto } from '@/domain/productos/Producto';
import type { ProductoRepositorio } from '@/domain/productos/ProductoRepositorio';

import type { AlmacenFotos } from './AlmacenFotos';

export interface DatosNuevoBote {
  caducidadFabricante?: Date;
  fechaApertura?: Date;
  fechaCompra?: Date;
}

export interface DatosNuevoProducto extends DatosNuevoBote {
  marca: string;
  nombre: string;
  categoria: Categoria;
  tono?: string;
  ean?: string;
  paoMeses?: number;
  /** Archivo local (cámara, galería) o URL https (catálogo). */
  foto?: string;
  /** '#RRGGBB' */
  colorTono?: string;
}

/** Lo que se puede cambiar de un producto ya creado (la foto va aparte). */
export interface DatosEdicionProducto {
  marca: string;
  nombre: string;
  categoria: Categoria;
  tono?: string;
  colorTono?: string;
  ean?: string;
  paoMeses?: number;
}

export interface FechasBote {
  fechaCompra?: Date;
  fechaApertura?: Date;
  caducidadFabricante?: Date;
}

export type EstadoProducto = EstadoCaducidad | { tipo: 'terminado' } | { tipo: 'sinBotes' };

export interface ResumenProducto {
  producto: Producto;
  /** El estado del bote más urgente que siga en uso. */
  estado: EstadoProducto;
  botesEnUso: number;
  botesAbiertos: number;
}

export interface BoteConEstado {
  unidad: Unidad;
  estado: EstadoCaducidad;
}

export interface DetalleProducto {
  producto: Producto;
  enUso: BoteConEstado[];
  terminados: Unidad[];
}

const PRIORIDAD: Record<EstadoProducto['tipo'], number> = {
  caducado: 0,
  caducaPronto: 1,
  vigente: 2,
  sinFecha: 3,
  terminado: 4,
  sinBotes: 5,
};

function fechaDe(estado: EstadoProducto): number {
  return 'fechaLimite' in estado ? estado.fechaLimite.getTime() : Infinity;
}

/** Los más urgentes primero; a igualdad de estado, el que antes caduca. */
function compararPorUrgencia(a: { estado: EstadoProducto }, b: { estado: EstadoProducto }) {
  return PRIORIDAD[a.estado.tipo] - PRIORIDAD[b.estado.tipo] || fechaDe(a.estado) - fechaDe(b.estado);
}

export class ServicioNeceser {
  constructor(
    private readonly productos: ProductoRepositorio,
    private readonly unidades: UnidadRepositorio,
    private readonly fotos: AlmacenFotos,
    private readonly generarId: () => string,
    /** Se llama tras cada cambio en los botes (para reprogramar los avisos). */
    private readonly alCambiar: () => void = () => {},
  ) {}

  /** Da de alta un producto junto con su primer bote. Devuelve el id del producto. */
  async nuevoProducto(datos: DatosNuevoProducto): Promise<string> {
    const ean = datos.ean?.trim() ? Ean.crear(datos.ean) : undefined;
    if (ean && (await this.productos.buscarPorEan(ean))) {
      throw new Error('Ya tienes un producto con este código de barras');
    }
    // Se construye antes de guardar la foto para no dejar fotos huérfanas si los datos no valen.
    const producto = new Producto({
      id: this.generarId(),
      marca: datos.marca,
      nombre: datos.nombre,
      categoria: datos.categoria,
      tono: datos.tono,
      ean,
      pao: datos.paoMeses !== undefined ? Pao.crear(datos.paoMeses) : undefined,
      colorTono: datos.colorTono,
    });
    const foto = datos.foto ? await this.guardarFotoSiSePuede(datos.foto) : undefined;
    await this.productos.guardar(producto.conFoto(foto));
    await this.nuevoBote(producto.id, datos);
    return producto.id;
  }

  /** Cambia los datos de un producto conservando su id, su foto y sus botes. */
  async editarProducto(productoId: string, datos: DatosEdicionProducto): Promise<void> {
    const actual = await this.productos.obtener(productoId);
    if (!actual) throw new Error('El producto no existe');
    const ean = datos.ean?.trim() ? Ean.crear(datos.ean) : undefined;
    if (ean) {
      const otro = await this.productos.buscarPorEan(ean);
      if (otro && otro.id !== productoId) throw new Error(`Ese código de barras ya es de ${otro.marca} ${otro.nombre}`);
    }
    await this.productos.guardar(
      new Producto({
        id: productoId,
        marca: datos.marca,
        nombre: datos.nombre,
        categoria: datos.categoria,
        tono: datos.tono,
        colorTono: datos.colorTono,
        ean,
        pao: datos.paoMeses !== undefined ? Pao.crear(datos.paoMeses) : undefined,
        foto: actual.foto,
        ingredientes: actual.ingredientes,
        analisis: actual.analisis,
      }),
    );
    // El PAO puede haber cambiado, y con él las fechas de los avisos.
    this.alCambiar();
  }

  async corregirBote(unidadId: string, fechas: FechasBote, hoy = new Date()): Promise<void> {
    const unidad = await this.obtenerUnidad(unidadId);
    unidad.corregirFechas(fechas, hoy);
    await this.unidades.guardar(unidad);
    this.alCambiar();
  }

  async obtenerBote(unidadId: string) {
    return this.unidades.obtener(unidadId);
  }

  async nuevoBote(productoId: string, datos: DatosNuevoBote = {}): Promise<string> {
    if (!(await this.productos.obtener(productoId))) throw new Error('El producto no existe');
    const unidad = new Unidad({
      id: this.generarId(),
      productoId,
      fechaCompra: datos.fechaCompra,
      fechaApertura: datos.fechaApertura,
      caducidadFabricante: datos.caducidadFabricante,
    });
    await this.unidades.guardar(unidad);
    this.alCambiar();
    return unidad.id;
  }

  async abrirBote(unidadId: string, fecha: Date): Promise<void> {
    const unidad = await this.obtenerUnidad(unidadId);
    unidad.abrir(fecha);
    await this.unidades.guardar(unidad);
    this.alCambiar();
  }

  async terminarBote(unidadId: string, fecha: Date): Promise<void> {
    const unidad = await this.obtenerUnidad(unidadId);
    unidad.terminar(fecha);
    await this.unidades.guardar(unidad);
    this.alCambiar();
  }

  async eliminarBote(unidadId: string): Promise<void> {
    await this.unidades.eliminar(unidadId);
    this.alCambiar();
  }

  /** Cambia (o quita, con `undefined`) el color del tono. */
  async cambiarColorTono(productoId: string, color: string | undefined): Promise<void> {
    const producto = await this.productos.obtener(productoId);
    if (!producto) throw new Error('El producto no existe');
    await this.productos.guardar(producto.conColorTono(color));
  }

  /** Cambia (o quita, con `undefined`) la foto del producto. */
  async cambiarFoto(productoId: string, origen: string | undefined): Promise<void> {
    const producto = await this.productos.obtener(productoId);
    if (!producto) throw new Error('El producto no existe');
    const nueva = origen ? await this.fotos.guardar(origen) : undefined;
    await this.productos.guardar(producto.conFoto(nueva));
    if (producto.foto) await this.fotos.eliminar(producto.foto);
  }

  async eliminarProducto(productoId: string): Promise<void> {
    const producto = await this.productos.obtener(productoId);
    await this.unidades.eliminarPorProducto(productoId);
    await this.productos.eliminar(productoId);
    this.alCambiar();
    if (producto?.foto) await this.fotos.eliminar(producto.foto);
  }

  async resumen(hoy: Date): Promise<ResumenProducto[]> {
    const [productos, unidades] = await Promise.all([this.productos.listar(), this.unidades.listar()]);
    const porProducto = new Map<string, Unidad[]>();
    for (const u of unidades) {
      porProducto.set(u.productoId, [...(porProducto.get(u.productoId) ?? []), u]);
    }

    return productos
      .map((producto) => {
        const suyas = porProducto.get(producto.id) ?? [];
        const enUso = suyas.filter((u) => !u.terminada);
        return {
          producto,
          estado: this.estadoProducto(producto, suyas, enUso, hoy),
          botesEnUso: enUso.length,
          botesAbiertos: enUso.filter((u) => u.abierta).length,
        };
      })
      .sort(
        (a, b) =>
          compararPorUrgencia(a, b) ||
          a.producto.marca.localeCompare(b.producto.marca) ||
          a.producto.nombre.localeCompare(b.producto.nombre),
      );
  }

  async detalle(productoId: string, hoy: Date): Promise<DetalleProducto | undefined> {
    const producto = await this.productos.obtener(productoId);
    if (!producto) return undefined;
    const unidades = await this.unidades.listarPorProducto(productoId);
    const pao = producto.paoEfectivo;
    return {
      producto,
      enUso: unidades
        .filter((u) => !u.terminada)
        .map((unidad) => ({ unidad, estado: unidad.estado(pao, hoy) }))
        .sort(compararPorUrgencia),
      terminados: unidades
        .filter((u) => u.terminada)
        .sort((a, b) => b.fechaTerminado!.getTime() - a.fechaTerminado!.getTime()),
    };
  }

  private estadoProducto(producto: Producto, todas: Unidad[], enUso: Unidad[], hoy: Date): EstadoProducto {
    if (todas.length === 0) return { tipo: 'sinBotes' };
    if (enUso.length === 0) return { tipo: 'terminado' };
    const pao = producto.paoEfectivo;
    return enUso.map((u) => ({ estado: u.estado(pao, hoy) })).sort(compararPorUrgencia)[0].estado;
  }

  /** Una foto que no se puede guardar (p. ej. la del catálogo sin conexión) no impide el alta. */
  private async guardarFotoSiSePuede(origen: string): Promise<string | undefined> {
    try {
      return await this.fotos.guardar(origen);
    } catch {
      return undefined;
    }
  }

  private async obtenerUnidad(id: string): Promise<Unidad> {
    const unidad = await this.unidades.obtener(id);
    if (!unidad) throw new Error('El bote no existe');
    return unidad;
  }
}
