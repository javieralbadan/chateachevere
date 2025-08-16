'use client';
import useFetchData from '@/hooks/useFetchData';
import { FiPhone } from 'react-icons/fi';
import Loading from '../atoms/Loading';
import { WhatsappButton } from '../molecules/WhatsappButton';

export const ContactSection = () => {
  const { data: contactInfo, loading } = useFetchData('contacto');

  if (loading) return <Loading />;

  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container mx-auto text-center">
        <h2 className="text-5xl sm:text-6xl md:text-7xl text-primary-color mb-6">
          Contactar agente de ventas
        </h2>

        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 mx-auto mb-8 md:mb-0">
            <div className="card h-full">
              <div className="flex items-center justify-center md:justify-start start mb-4">
                <FiPhone className="text-primary-color text-xl mr-5" />
                <div className="md:text-left">
                  <p className="font-medium">Llamar ahora:</p>
                  <a
                    href={`tel:+${contactInfo.phone}`}
                    className="text-light hover:text-primary-color transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </div>

              <div className="mt-8">
                <WhatsappButton
                  message="Hola, me interesa conocer más sobre sus servicios"
                  buttonText="Enviar mensaje por WhatsApp"
                  phone={contactInfo.whatsapp}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
