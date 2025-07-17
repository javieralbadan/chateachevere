import { MenuCategory } from '@/services/core/menu';

interface TenantConfig {
  transfersPhoneNumber: string;
  deliveryCost: number;
  categories: Record<string, MenuCategory>;
}

// TODO: Cargar esto desde un Gist
// Configuración del menú - Fuente única de verdad
export const TENANT_CONFIG: TenantConfig = {
  transfersPhoneNumber: '573112112565', // Número en formato: código país + número
  deliveryCost: 2000, // En pesos, $2.000 por domicilio
  categories: {
    desayunos: {
      name: 'DESAYUNOS DISPONIBLES',
      emoji: '🌅',
      items: [
        { name: 'Desayuno bogotano', price: 15000 },
        { name: 'Desayuno ranchero', price: 16000 },
        { name: 'Desayuno tolimense con tamal', price: 18000 },
        { name: 'Desayuno llanero', price: 17000 },
        { name: 'Desayuno costeño', price: 16500 },
        { name: 'Desayuno con caldo', price: 14500 },
        { name: 'Regional con calentao', price: 15500 },
      ],
    },
    almuerzos: {
      name: 'ALMUERZOS DISPONIBLES',
      emoji: '🍽️',
      includes: 'arroz, aguacate, ensalada, jugo y principio',
      items: [
        { name: 'Almuerzo del día (consulta nuestra imagen de perfil)', price: 18000 },
        { name: 'Ejecutivo con Churrasco', price: 20500 },
        { name: 'Ejecutivo con Pescado sudado', price: 20500 },
        { name: 'Ejecutivo con Pollo especial', price: 20500 },
        { name: 'Ejecutivo con Callo marinera', price: 20500 },
        { name: 'Ejecutivo con Sudado carne yuca', price: 20500 },
        { name: 'Ejecutivo con Pollo sudado yuca', price: 20500 },
        { name: 'Ejecutivo con Mojarra frita', price: 20500 },
        { name: 'Ejecutivo con Carne asada', price: 20500 },
      ],
    },
  },
};

export type Category = keyof typeof TENANT_CONFIG.categories;
