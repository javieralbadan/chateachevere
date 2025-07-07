import type {
  BrandInfoType,
  ContactInfoType,
  HeroBannerType,
  ServiceType,
  TestimonialType,
} from './types';

export const validators = {
  negocio: (data: BrandInfoType) => {
    return (
      data &&
      typeof data.title === 'string' &&
      typeof data.description === 'string' &&
      typeof data.logo === 'string'
    );
  },

  contacto: (data: ContactInfoType) => {
    return (
      data &&
      typeof data.phone === 'string' &&
      typeof data.whatsapp === 'string' &&
      typeof data.coverage === 'string' &&
      typeof data.schedule === 'string'
    );
  },

  banner: (data: HeroBannerType) => {
    return (
      data &&
      typeof data.title === 'string' &&
      typeof data.description === 'string' &&
      typeof data.tagline === 'string' &&
      typeof data.buttonText === 'string'
    );
  },

  servicios: (data: ServiceType[]) => {
    return (
      Array.isArray(data) &&
      data.every(
        (service) =>
          service &&
          typeof service.id === 'string' &&
          typeof service.name === 'string' &&
          typeof service.description === 'string' &&
          (typeof service.price === 'string' ||
            (Array.isArray(service.price) &&
              service.price.every(
                (pt) => typeof pt.quantitySessions === 'string' && typeof pt.price === 'string',
              ))) &&
          typeof service.whatsappText === 'string' &&
          Array.isArray(service.images),
      )
    );
  },

  testimonios: (data: TestimonialType[]) => {
    return (
      Array.isArray(data) &&
      data.every(
        (testimonial) =>
          testimonial &&
          typeof testimonial.text === 'string' &&
          typeof testimonial.author === 'string' &&
          typeof testimonial.avatar === 'string',
      )
    );
  },
};
