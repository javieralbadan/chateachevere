import { CategoriesFlowConfig, TenantConfig } from '@/types/menu';
import { getTenantConfig, isWeekend } from '@/utils/tenantUtils';
import CONFIGURACION_SEMANA from './menu_dia_semana.json';
import CONFIGURACION_FIN_DE_SEMANA from './menu_fin_de_semana.json';

const BASE_URL =
  'https://gist.githubusercontent.com/javieralbadan/3b410ae9c081189a713d3df721210f21/raw';

const dataSourceMap = {
  week: {
    gistUrl: `${BASE_URL}/menu_del_dia.json`,
    fallbackData: CONFIGURACION_SEMANA,
  },
  weekend: {
    gistUrl: `${BASE_URL}/menu_fin_de_semana.json`,
    fallbackData: CONFIGURACION_FIN_DE_SEMANA,
  },
};

const dataConfig = !isWeekend() ? dataSourceMap.weekend : dataSourceMap.week;

export const TENANT_ID = 'carne-brava';
export const TENANT_CONFIG: TenantConfig = await getTenantConfig(
  TENANT_ID,
  dataConfig.fallbackData,
  dataConfig.gistUrl,
);
export const tenantCategories = (TENANT_CONFIG as CategoriesFlowConfig).categories || {};
