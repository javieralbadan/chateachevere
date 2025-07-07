'use client';
import { ServiceType } from '@/data/types';
import Image from 'next/image';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import useFetchData from '@/hooks/useFetchData';
import { WhatsappButton } from './WhatsappButton';

interface Props {
  service: ServiceType;
  isEven: boolean;
}

export const ServiceContent = ({ service, isEven }: Props) => {
  const { data: contactInfo } = useFetchData('contacto');

  return (
    <div className="container mx-auto">
      {/* <div className="w-full lg:w-1/2 h-64 lg:h-full"> */}
      <MobileCarousel images={service.images} serviceName={service.name} />
      <DesktopGridGallery images={service.images} serviceName={service.name} />

      <div className="flex flex-col w-full container mx-auto justify-center text-center p-6 md:p-12 space-y-4 md:space-y-6">
        <h2 className="text-6xl md:text-8xl">{service.name}</h2>
        <p className="text-base md:text-lg leading-relaxed">{service.description}</p>

        <div className="font-semibold text-lg">
          {typeof service.price === 'string'
            ? service.price
            : Array.isArray(service.price)
              ? service.price.map((tier, i) => (
                  <div key={i} className="mb-1">
                    {tier.quantitySessions}: {tier.price}
                  </div>
                ))
              : ''}
        </div>

        <div className="text-center">
          <p className="text-sm md:text-base italic">{service.extraInfo}</p>
        </div>
        {contactInfo && (
          <div className="pt-4">
            <WhatsappButton
              message={service.whatsappText}
              buttonText="Quiero chatear chevere"
              phone={contactInfo.whatsapp}
              variant={isEven ? 'primary' : 'inverted'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface ImagesProps {
  images: string[];
  serviceName: string;
}

const MobileCarousel: React.FC<ImagesProps> = ({ images, serviceName }) => (
  <div className="block md:hidden h-full">
    <Carousel
      showArrows
      autoPlay
      infiniteLoop
      showStatus={false}
      showThumbs={false}
      interval={4000}
      className="h-full"
    >
      {images.map((image, idx) => (
        <div key={idx} className="relative h-64">
          <Image
            src={image}
            alt={`Imagen ${serviceName}`}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}
    </Carousel>
  </div>
);

const DesktopGridGallery: React.FC<ImagesProps> = ({ images, serviceName }) => (
  <div className="hidden md:flex md:grid-cols-3 md:grid-rows-1 w-full h-[350px] lg:h-[400px] xl:h-[450px] p-2 gap-2">
    {images.map((image, index) => (
      <div key={index} className="relative w-full h-full">
        <Image
          src={image}
          alt={`Imagen ${serviceName}`}
          fill
          className="object-cover rounded-lg"
          sizes="70vw"
        />
      </div>
    ))}
  </div>
);
