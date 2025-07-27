import { CategoriesFlowConfig, TenantConfig } from '@/types/menu';
import { SpanishTenantConfig } from '@/types/menu-spanish';
import { getTenantConfig } from '@/utils/tenantUtils';

// Configuración del menú - Fuente única de verdad
export const fallbackData: SpanishTenantConfig = {
  numeroTransferencias: '573112112565', // Número en formato: código país + número
  costoDomicilio: 2000, // En pesos, $2.000 por domicilio
  categorias: {
    desayunos: {
      nombre: 'DESAYUNOS DISPONIBLES',
      emoji: '🌅',
      items: [
        { nombre: 'Desayuno bogotano', precio: 15000 },
        { nombre: 'Desayuno ranchero', precio: 16000 },
        { nombre: 'Desayuno tolimense con tamal', precio: 18000 },
        { nombre: 'Desayuno llanero', precio: 17000 },
        { nombre: 'Desayuno costeño', precio: 16500 },
        { nombre: 'Desayuno con caldo', precio: 14500 },
        { nombre: 'Regional con calentao', precio: 15500 },
      ],
    },
    almuerzos: {
      nombre: 'ALMUERZOS DISPONIBLES',
      emoji: '🍽️',
      infoAdicional: '*Todos incluyen:* arroz, aguacate, ensalada, jugo y principio',
      items: [
        { nombre: 'Almuerzo del día (consulta nuestra imagen de perfil)', precio: 18000 },
        { nombre: 'Ejecutivo con Churrasco', precio: 20500 },
        { nombre: 'Ejecutivo con Pescado sudado', precio: 20500 },
        { nombre: 'Ejecutivo con Pollo especial', precio: 20500 },
        { nombre: 'Ejecutivo con Callo marinera', precio: 20500 },
        { nombre: 'Ejecutivo con Sudado carne yuca', precio: 20500 },
        { nombre: 'Ejecutivo con Pollo sudado yuca', precio: 20500 },
        { nombre: 'Ejecutivo con Mojarra frita', precio: 20500 },
        { nombre: 'Ejecutivo con Carne asada', precio: 20500 },
      ],
    },
  },
};

export const TENANT_ID = 'cheefoodies';
// Intentar fetch de configuraciones desde Gist y mapear a inglés
export const TENANT_CONFIG: TenantConfig = await getTenantConfig(TENANT_ID, fallbackData);
export const tenantCategories = (TENANT_CONFIG as CategoriesFlowConfig).categories;
