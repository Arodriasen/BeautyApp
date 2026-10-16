/** Puerto hacia donde se guardan las fotos de los productos (el almacenamiento del móvil). */
export interface AlmacenFotos {
  /**
   * Guarda una copia propia de la foto y devuelve su referencia.
   * `origen` puede ser un archivo local (cámara, galería) o una URL https (catálogo).
   */
  guardar(origen: string): Promise<string>;
  eliminar(referencia: string): Promise<void>;
}
