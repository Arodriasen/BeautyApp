/**
 * Period After Opening: meses que dura un producto una vez abierto
 * (el icono del bote abierto con "6M", "12M"...).
 */
export class Pao {
  static readonly MAX_MESES = 60;

  private constructor(readonly meses: number) {}

  static crear(meses: number): Pao {
    if (!Number.isInteger(meses) || meses < 1 || meses > Pao.MAX_MESES) {
      throw new Error(`El PAO debe ser un número entero de meses entre 1 y ${Pao.MAX_MESES}`);
    }
    return new Pao(meses);
  }

  /** Acepta el texto tal cual aparece en el envase: "12M", "12 m", "12". */
  static desdeTexto(texto: string): Pao {
    const m = /^\s*(\d{1,2})\s*m?\s*$/i.exec(texto);
    if (!m) throw new Error(`PAO no reconocido: "${texto}"`);
    return Pao.crear(Number(m[1]));
  }

  toString(): string {
    return `${this.meses}M`;
  }
}
