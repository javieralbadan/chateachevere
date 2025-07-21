export function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-CO')}`;
}

export function isTestingOrder(tenantName: string): boolean {
  const isDev = process.env.NODE_ENV === 'development';
  const tenantsTesters = ['cheefoodies'];

  return isDev || tenantsTesters.includes(tenantName);
}
