
/**
 * Utilitários para cálculos financeiros precisos.
 * Evita erros de ponto flutuante (IEEE 754) convertendo para centavos (inteiros).
 */
export const Money = {
  /**
   * Converte um valor decimal para centavos (inteiro).
   */
  toCents: (value: number): number => {
    if (isNaN(value)) return 0;
    return Math.round(value * 100);
  },

  /**
   * Converte centavos de volta para valor decimal.
   */
  fromCents: (cents: number): number => {
    return cents / 100;
  },

  /**
   * Soma uma lista de valores decimais de forma segura.
   */
  sum: (...values: number[]): number => {
    const totalCents = values.reduce((acc, val) => acc + Money.toCents(val), 0);
    return Money.fromCents(totalCents);
  },

  /**
   * Subtrai o segundo valor do primeiro de forma segura.
   */
  subtract: (a: number, b: number): number => {
    const centsA = Money.toCents(a);
    const centsB = Money.toCents(b);
    return Money.fromCents(centsA - centsB);
  },

  /**
   * Formata um valor para BRL (Real Brasileiro).
   */
  format: (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },

  /**
   * Garante que um número tenha no máximo 2 casas decimais, sem erros de precisão.
   */
  sanitize: (value: any): number => {
    const num = Number(value);
    if (isNaN(num)) return 0;
    return Money.fromCents(Money.toCents(num));
  }
};
