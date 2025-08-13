'use client';
import {
  ClockCircleOutlined,
  CommentOutlined,
  DollarOutlined,
  GiftOutlined,
  RobotOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Col, Divider, Row } from 'antd';
import Image from 'next/image';
import Logo from '../atoms/Logo';
import { WhatsappButton } from '../molecules/WhatsappButton';

export const BrandSection: React.FC = () => {
  return (
    <div className="w-full bg-white">
      <section className="container mx-auto w-full py-12 sm:py-16 text-center">
        <h3 className="relative z-20 text-5xl sm:text-6xl text-primary-color -mb-5">
          Casos de Éxito
        </h3>

        <div className="relative inline-block mx-auto z-10">
          {/* Círculo exterior (borde rosado) */}
          <div className="w-64 h-64 rounded-full flex items-center justify-center bg-green-100">
            {/* Círculo interior con separación */}
            <div className="w-52 h-52 rounded-full bg-white flex items-center justify-center">
              <Logo />
            </div>
          </div>
        </div>

        <h3 className="relative z-20 text-3xl sm:text-4xl mt-4">
          Lo que tu negocio puede lograr...
        </h3>

        <ul className="mt-8 mb-4 max-w-4xl mx-auto space-y-6 text-left">
          <li className="flex items-start gap-4 px-4">
            <RobotOutlined className="text-2xl text-primary-color mt-1 flex-shrink-0" />
            <span className="text-xl text-dark">
              <b>Olvídate de dejar en visto</b>, tu chatbot responde siempre
            </span>
          </li>

          <li className="flex items-start gap-4 px-4">
            <CommentOutlined className="text-2xl text-primary-color mt-1 flex-shrink-0" />
            <span className="text-xl text-dark">
              <b>No es solo un saludo automático</b>, es atención constante sin descuidar tu negocio
            </span>
          </li>

          <li className="flex items-start gap-4 px-4">
            <ClockCircleOutlined className="text-2xl text-primary-color mt-1 flex-shrink-0" />
            <span className="text-xl text-dark">
              <b>24/7 en tu WhatsApp Business:</b> Tus clientes interactúan a toda hora, tu tranqui,
              él trabaja
            </span>
          </li>

          <li className="flex items-start gap-4 px-4">
            <DollarOutlined className="text-2xl text-primary-color mt-1 flex-shrink-0" />
            <span className="text-xl text-dark">
              <b>Los mejores precios del mercado</b> y pagos sin enredos (vía Nequi, llaves, Bre-B).
            </span>
          </li>

          <li className="flex items-start gap-4 px-4">
            <SendOutlined className="text-2xl text-primary-color mt-1 flex-shrink-0" />
            <span className="text-xl text-dark">
              <b>Sin topes de mensajes</b>, todos nuestros planes incluyen mensajes ilimitados
            </span>
          </li>

          <li className="flex items-start gap-4 px-4">
            <GiftOutlined className="text-2xl text-primary-color mt-1 flex-shrink-0" />
            <span className="text-xl text-dark">
              <b>Oferta de temporada:</b> Ahorra el costo de la instalación inicial
            </span>
          </li>
        </ul>

        <h3 className="text-3xl sm:text-4xl mt-8">¿Quieres verlo tu mismo?</h3>
        <p className="mt-2 mx-auto px-4 text-xl text-dark">
          Tenemos diferentes flujos de prueba para que imagines como se sentirán tus clientes cuando
          automatices tu chat...
        </p>

        <Row justify="center" gutter={[16, 16]} className="mt-8">
          <Col xs={24} md={11} className="flex items-center justify-center">
            <div>
              <p className="mb-4 mx-auto px-4 text-xl text-dark">
                Inicia una conversación al número
                <br />
                <b>322 224 2768</b>
              </p>
              <WhatsappButton
                message="Hola, quiero probar el chatbot"
                buttonText="Probar chatbot"
                phone="573222242768"
              />
            </div>
          </Col>

          <Col xs={24} md={2} className="flex items-center justify-center">
            <Divider
              type="vertical"
              className="hidden md:block h-full"
              style={{ borderColor: '#d9d9d9', borderWidth: '1px' }}
            />
            <Divider
              className="block md:hidden my-4"
              style={{ borderColor: '#d9d9d9', borderWidth: '1px' }}
            />
          </Col>

          <Col xs={24} md={11} className="flex justify-center">
            <div className="flex flex-col items-center justify-center">
              <p className="mt-8 mx-auto px-4 text-xl text-dark">Escanea este QR con tu celu</p>
              <Image
                src="/imgs/qrcode-sandbox.png"
                alt="Código QR del Sandbox"
                width={300}
                height={300}
              />
            </div>
          </Col>
        </Row>
      </section>
    </div>
  );
};
