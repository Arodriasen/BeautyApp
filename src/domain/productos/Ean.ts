/**
 * Código de barras del producto (EAN-8, UPC-A de 12 o EAN-13), con dígito de control válido.
 * Los UPC-A se guardan como EAN-13 (con un 0 delante) para que el mismo producto
 * tenga siempre el mismo valor, lo lea el escáner de una forma u otra.
 */
export class Ean {
  private constructor(readonly valor: string) {}

  static crear(texto: string): Ean {
    const limpio = texto.replace(/\s+/g, '');
    if (!Ean.esValido(limpio)) {
      throw new Error(`Código de barras no válido: "${texto}"`);
    }
    return new Ean(limpio.length === 12 ? `0${limpio}` : limpio);
  }

  /** Como `crear`, pero devuelve `undefined` si no es válido. */
  static intentar(texto: string): Ean | undefined {
    const limpio = texto.replace(/\s+/g, '');
    return Ean.esValido(limpio) ? Ean.crear(limpio) : undefined;
  }

  static esValido(texto: string): boolean {
    if (!/^(\d{8}|\d{12}|\d{13})$/.test(texto)) return false;

    const digitos = [...texto].map(Number);
    const control = digitos.pop()!;
    // Desde la derecha (sin el de control), los pesos alternan 3, 1, 3, 1...
    const suma = digitos
      .reverse()
      .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
    return (10 - (suma % 10)) % 10 === control;
  }

  equals(otro: Ean): boolean {
    return this.valor === otro.valor;
  }
}
