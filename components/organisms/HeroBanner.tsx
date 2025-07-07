'use client';
import Image from 'next/image';
import useFetchData from '@/hooks/useFetchData';
import Loading from '../atoms/Loading';
import { scrollToSection } from '@/utils/scroll';
import { HeroBannerType, ServiceType } from '@/data/types';

export const HeroBanner = () => {
  const { data: services, loading: loadingServices } = useFetchData('servicios');
  const { data: banner, loading: loadingBanner } = useFetchData('banner');

  if (loadingServices || loadingBanner || !services || !banner) {
    return <Loading />;
  }

  return (
    <section className="relative min-h-screen">
      <div className="absolute lg:inset-y-0 lg:left-0 w-full lg:w-1/2 min-h-screen flex items-center bg-primary-color text-white text-center">
        <InformativeSection {...banner} />
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 min-h-[40vh] lg:min-h-screen">
        <ServicesSection services={services} />
      </div>
    </section>
  );
};

const InformativeSection = ({ title, description, buttonText, tagline }: HeroBannerType) => (
  <>
    <div className="container mx-auto px-4 sm:px-8 py-4 sm:py-16 lg:py-0">
      <h1 className="text-7xl sm:text-8xl md:text-9xl mb-4">{title}</h1>
      <p className="text-2xl sm:text-3xl my-4 font-light">{description}</p>
      <button
        onClick={() => scrollToSection('contact')}
        className="inline-block bg-white text-primary-color my-5 py-2 sm:py-3 px-5 sm:px-8 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:opacity-90"
      >
        {buttonText}
      </button>
    </div>
    <p className="absolute bottom-0 w-full mb-5 px-4 sm:text-xl">{tagline}</p>
  </>
);

const ServicesSection = ({ services }: { services: ServiceType[] }) => (
  <div className="grid grid-cols-2 h-full">
    {services.slice(0, 4).map((servicio) => (
      <button
        key={servicio.id}
        onClick={() => scrollToSection(servicio.id)}
        className="relative group overflow-hidden cursor-pointer"
      >
        <Image
          src={servicio.images[0]}
          alt={servicio.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 group-hover:bg-opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl text-white bg-black bg-opacity-50 px-4 py-2 rounded text-center">
            {servicio.name}
          </span>
        </div>
      </button>
    ))}
  </div>
);
