'use client';
import useFetchData from '@/hooks/useFetchData';
import Loading from '../atoms/Loading';
import { ServiceContent } from '../molecules/ServiceContent';

export const ServicesSection: React.FC = () => {
  const { data: services, loading } = useFetchData('servicios');

  if (loading) return <Loading />;

  return (
    <section id="services">
      {services.map((service, index) => {
        const isEven = index % 2 === 0;
        const containerClasses = isEven
          ? 'bg-white text-black'
          : 'bg-[var(--primary-color)] text-white';

        return (
          <div key={service.id} id={service.id} className={containerClasses}>
            <ServiceContent service={service} isEven={isEven} />
          </div>
        );
      })}
    </section>
  );
};
