import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import type { AlmacenFotos } from '@/application/AlmacenFotos';

const CARPETA = 'fotos';

/**
 * Guarda las fotos en la carpeta de documentos de la app. La referencia es solo el
 * nombre del archivo: la ruta completa puede cambiar entre instalaciones.
 */
export class FotosEnDispositivo implements AlmacenFotos {
  async guardar(origen: string): Promise<string> {
    const carpeta = new Directory(Paths.document, CARPETA);
    carpeta.create({ idempotent: true, intermediates: true });
    const destino = new File(carpeta, `${randomUUID()}.jpg`);

    if (origen.startsWith('https://')) {
      await File.downloadFileAsync(origen, destino);
    } else {
      await new File(origen).copy(destino);
    }
    return destino.name;
  }

  async eliminar(referencia: string): Promise<void> {
    const archivo = new File(Paths.document, CARPETA, referencia);
    if (archivo.exists) archivo.delete();
  }
}

/** URI para mostrar la foto con <Image>. */
export function uriFoto(referencia: string): string {
  return new File(Paths.document, CARPETA, referencia).uri;
}
