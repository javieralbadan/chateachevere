'use client';
import useFetchData from '@/hooks/useFetchData';
import Loading from '../atoms/Loading';
import Logo from '../atoms/Logo';

export const BrandSection: React.FC = () => {
  const { data: brandInfo, loading } = useFetchData('negocio');

  if (loading) return <Loading />;

  const [titleTop, titleBottom] = brandInfo.title.split(' ');

  return (
    <section className="container mx-auto w-full py-12 sm:py-16 bg-[var(--off-white)] text-center">
      <h1 className="relative z-20 text-8xl sm:text-9xl text-primary-color -mb-12">{titleTop}</h1>

      <div className="relative inline-block mx-auto z-10">
        {/* Círculo exterior (borde rosado) */}
        <div className="w-64 h-64 rounded-full flex items-center justify-center bg-green-100">
          {/* Círculo interior con separación */}
          <div className="w-52 h-52 rounded-full bg-[var(--off-white)] flex items-center justify-center">
            <Logo />
          </div>
        </div>
      </div>

      <h1 className="relative z-20 text-8xl sm:text-9xl text-primary-color -mt-8">{titleBottom}</h1>
      <p className="mt-4 mx-auto px-4 text-2xl text-dark">{brandInfo.description}</p>
    </section>
  );
};
