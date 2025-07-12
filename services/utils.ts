export function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-CO')}`;
}
