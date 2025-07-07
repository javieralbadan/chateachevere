import {
  BrandInfoType,
  ContactInfoType,
  HeroBannerType,
  SeoType,
  ServiceType,
  TestimonialType,
} from '@/data/types';
import contactJson from './contacto.json';
import bannerJson from './banner.json';
import brandJson from './negocio.json';
import seoJson from './seo.json';
import servicesJson from './servicios.json';
import testimonialsJson from './testimonios.json';

const banner = bannerJson as HeroBannerType;
const negocio = brandJson as BrandInfoType;
const contacto = contactJson as ContactInfoType;
const servicios = servicesJson as ServiceType[];
const testimonios = testimonialsJson as TestimonialType[];
const seo = seoJson as SeoType;

const fallbackData = {
  banner,
  negocio,
  contacto,
  servicios,
  testimonios,
  seo: seo,
};

export default fallbackData;
