export type PriceTier = {
  quantitySessions: string;
  price: string;
};

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  price: string | PriceTier[];
  images: string[];
  benefits?: string[];
  extraInfo?: string;
  whatsappText: string;
}

export interface TestimonialType {
  id: number;
  text: string;
  author: string;
  avatar: string;
}

export interface HeroBannerType {
  title: string;
  description: string;
  buttonText: string;
  tagline: string;
}

export interface BrandInfoType {
  title: string;
  description: string;
  logo: string;
}

export interface ContactInfoType {
  phone: string;
  whatsapp: string;
  coverage: string;
  schedule: string;
}

export interface SeoType {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
  };
}

export type EndpointDataMap = {
  banner: HeroBannerType;
  negocio: BrandInfoType;
  contacto: ContactInfoType;
  servicios: ServiceType[];
  testimonios: TestimonialType[];
};

export type ValidEndpoint = keyof EndpointDataMap;
