import './globals.css';
import infoNegocio from '@/data/negocio.json';
import infoContacto from '@/data/contacto.json';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  ...infoNegocio,
  metadataBase: new URL('https://chateachevere.web.app/'),
  openGraph: {
    title: 'Chatea Chevere',
    description: infoNegocio.description,
    images: [infoNegocio.logo],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: infoNegocio.title,
    description: infoNegocio.description,
    image: infoNegocio.logo,
    telephone: infoContacto.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bogotá',
      addressRegion: 'Cundinamarca',
      addressCountry: 'CO',
    },
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
