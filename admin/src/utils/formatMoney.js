/** Formata valor monetário em Real (BRL). */
export function formatMoney(value) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** Alias usado em telas de relatório / cardápio. */
export const formatPrice = formatMoney
