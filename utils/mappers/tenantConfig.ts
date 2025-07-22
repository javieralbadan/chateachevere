import { MenuCategory, SpanishConfiguration, TenantConfig } from '@/types/conversation';

export const mapConfigSpanishToEnglish = (initialConfig: SpanishConfiguration): TenantConfig => {
  const categories: { [key: string]: MenuCategory } = {};

  Object.keys(initialConfig.categorias).forEach((key) => {
    const category = initialConfig.categorias[key];

    categories[key] = {
      name: category.nombre,
      emoji: category.emoji,
      footerInfo: category.infoAdicional,
      items: category.items.map((item) => ({
        name: item.nombre,
        price: item.precio,
      })),
    };
  });

  return {
    transfersPhoneNumber: initialConfig.numeroTransferencias,
    deliveryCost: initialConfig.costoDomicilio,
    categories,
  };
};
