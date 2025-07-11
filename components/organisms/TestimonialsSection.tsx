'use client';
import useFetchData from '@/hooks/useFetchData';
import Image from 'next/image';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import Loading from '../atoms/Loading';
import Logo from '../atoms/Logo';

export const TestimonialsSection = () => {
  const { data: testimonials, loading } = useFetchData('testimonios');

  if (loading) return <Loading />;

  return (
    <section className="py-16 bg-[var(--off-white)]">
      <div className="container mx-auto text-center">
        <h2 className="text-5xl sm:text-6xl md:text-7xl">Testimonios</h2>
        <Carousel
          autoPlay
          infiniteLoop
          showArrows={false}
          showStatus={false}
          showThumbs={false}
          interval={5000}
        >
          {testimonials.map((item, index) => (
            <div key={index} className="flex flex-col items-center px-8 pb-12">
              {item.avatar ? (
                <Image src={item.avatar} alt={item.author} fill className="object-cover" />
              ) : (
                <FallbackAvatar />
              )}
              <p className="italic mb-2">&quot;{item.text}&quot;</p>
              <span className="font-semibold">{item.author}</span>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
};

const FallbackAvatar = () => (
  <div className="w-16 h-16 bg-gray-200 rounded-full my-4">
    <Logo />
  </div>
);
