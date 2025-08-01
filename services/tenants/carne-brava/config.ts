import {
  CategoriesConfig,
  CategoriesFlowConfig,
  SequentialConfig,
  SequentialFlowConfig,
} from '@/types/menu';
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

const dataSource = isWeekend() ? dataSourceMap.weekend : dataSourceMap.week;
const convoConfig = await getTenantConfig(dataSource.fallbackData, dataSource.gistUrl);
const tenantConfig = { ...convoConfig, tenantId: 'carne-brava' };

let tenantSortedSteps: SequentialConfig = [];
let tenantCategories: CategoriesConfig = {};
if (tenantConfig.flowType === 'sequential') {
  tenantSortedSteps = (tenantConfig as SequentialFlowConfig).steps.sort(
    (a, b) => a.order - b.order,
  );
}
if (tenantConfig.flowType === 'categories') {
  tenantCategories = (tenantConfig as CategoriesFlowConfig).categories;
}

export { tenantCategories, tenantConfig, tenantSortedSteps };
