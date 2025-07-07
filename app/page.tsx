import Loading from '@/components/atoms/Loading';
import { ScrollToTopButton } from '@/components/atoms/ScrollToTopButton';
import { ContactSection } from '@/components/organisms/ContactSection';
import { Footer } from '@/components/organisms/Footer';
import { HeroBanner } from '@/components/organisms/HeroBanner';
import { ServicesSection } from '@/components/organisms/ServicesSection';
import { TestimonialsSection } from '@/components/organisms/TestimonialsSection';
import { Suspense } from 'react';

export default function Home() {
  return (
    <main>
      <Suspense fallback={<Loading />}>
        <HeroBanner />
        <ServicesSection />
        <TestimonialsSection />
        <ContactSection />
        <Footer />
      </Suspense>
      <ScrollToTopButton />
    </main>
  );
}
