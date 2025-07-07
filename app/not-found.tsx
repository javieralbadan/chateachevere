'use client';
import Logo from '@/components/atoms/Logo';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--off-white)] flex items-center justify-center">
      <section className="container mx-auto w-full py-6 sm:py-16 text-center">
        <h1 className="relative z-20 text-6xl sm:text-8xl text-primary-color -mt-6">
          Página no encontrada
        </h1>

        <div className="relative inline-block mx-auto z-10">
          <div className="w-64 h-64 rounded-full flex items-center justify-center bg-green-100">
            <div className="w-52 h-52 rounded-full bg-[var(--off-white)] flex items-center justify-center">
              <Logo />
            </div>
          </div>
        </div>

        <p className="my-6 mx-auto px-4 text-lg sm:text-2xl text-dark max-w-2xl">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        <Link href="/" style={{ textDecoration: 'underline' }}>
          Volver al Inicio
        </Link>
      </section>
    </main>
  );
}
