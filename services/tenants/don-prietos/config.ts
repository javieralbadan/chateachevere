import {
  CategoriesConfig,
  CategoriesFlowConfig,
  SequentialConfig,
  SequentialFlowConfig,
} from '@/types/menu';
import { getTenantConfig } from '@/utils/tenantUtils';
import FALLBACK_DATA from './menu.json';

// TODO: Implementar FIRESTORE

const tenantId = 'don-prietos';
const convoConfig = await getTenantConfig(FALLBACK_DATA);
const tenantConfig = { ...convoConfig, tenantId };

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
