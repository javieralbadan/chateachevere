'use client';
import LegalBreadcrumb from '@/components/atoms/LegalBreadcrumb';
import { Divider, Typography } from 'antd';
const { Title } = Typography;

const ServiceConditionsPage = () => {
  return (
    <section className="legal-container">
      <LegalBreadcrumb currentPage="Condiciones del Servicio" />

      <Title level={2}>CONDICIONES DEL SERVICIO</Title>

      <Title level={3}>CONDICIONES GENERALES</Title>
      <p>
        CHATEA CHEVERE se reserva el derecho de modificar estos términos y condiciones en cualquier
        momento. Si se presentan modificaciones a estos términos, los mismos serán notificados por
        el correo electrónico señalado por los usuarios.
      </p>

      <Divider />

      <Title level={3}>RELACIÓN CONTRACTUAL</Title>
      <p>
        El USUARIO reconoce y acepta que CHATEA CHEVERE es una plataforma digital que permite tanto
        a NEGOCIOS como USUARIOS interactuar para satisfacer sus necesidades dentro del marco del
        ofrecimiento/consumo de productos y servicios para provecho propio, dentro del marco de la
        legislación colombiana.
      </p>
      <p>
        Por lo anterior, el USUARIO reconoce que CHATEA CHEVERE no es el directo prestador del
        servicio o vendedor del producto, sino tan solo un intermediario para la reserva de citas,
        agendamiento de pedidos, cotización de servicios profesionales, etc. Así mismo, el USUARIO
        reconoce y acepta que CHATEA CHEVERE no es propietario de ninguno de los NEGOCIOS
        disponibles en la plataforma, ni arrendador directo de éstos, ni tampoco empleador de los
        mismos.
      </p>
      <p>
        CHATEA CHEVERE permite a los USUARIOS interactuar con los clientes de forma directa y de
        acuerdo con las condiciones y términos de uso de cada establecimiento. Así mismo, permite
        por medio de ésta la interacción con NEGOCIOS que prestan sus servicios sin ningún vínculo
        laboral con CHATEA CHEVERE.
      </p>
      <p>
        Por lo tanto, entre CHATEA CHEVERE y las partes involucradas no existe más que una relación
        de intermediación, de manera que cualquier inconveniente que se presente en la prestación
        del servicio por los NEGOCIOS y/o con los productos ofrecidos deberán ser resueltos por las
        partes involucradas.
      </p>
      <p>
        No obstante lo anterior, CHATEA CHEVERE prestará sus buenos oficios para la resolución
        efectiva de cualquier inconveniente que se pueda presentar, mediante el proceso señalado y
        el procedimiento de PQRS (Peticiones, Quejas, Reclamos y Sugerencias) que trae la
        plataforma.
      </p>
      <p>
        Estas Condiciones sustituyen expresamente los acuerdos o compromisos previos con el USUARIO.
      </p>

      <Divider />

      <Title level={4}>EXONERACIÓN DE RESPONSABILIDAD</Title>
      <p>
        La plataforma digital CHATEA CHEVERE ofrece un servicio &quot;en el estado en que se
        encuentra&quot;, sin garantía ni condición. La plataforma, y en consecuencia el servicio, no
        se declaran sin interrupciones ni sin errores, ni tampoco garantiza la corrección total de
        los errores que se puedan presentar.
      </p>
      <p>
        Tanto el NEGOCIO como el USUARIO, renuncian a todos los daños especiales, indirectos y
        consecuentes que se pudieran presentar.
      </p>
      <p>
        La información ofrecida en la plataforma CHATEA CHEVERE solo constituye recomendación, por
        lo cual, no es vinculante y en consecuencia, el uso de ésta por parte del USUARIO se hará
        bajo su propia responsabilidad.
      </p>
      <p>
        Con ocasión del servicio prestado por CHATEA CHEVERE, este no es responsable de los
        servicios especializados prestados por los NEGOCIOS. Los productos y servicios que sean
        promocionados por medio de la plataforma CHATEA CHEVERE, serán gestionados directamente por
        los NEGOCIOS que administran su correspondiente marca, empresa o establecimiento, por lo
        cual, CHATEA CHEVERE no responderá por cualquier error, acto u omisión de los NEGOCIOS o de
        terceros, incluyendo, sin limitarse a, el uso de cualquier servicio o producto anunciado a
        través de la plataforma, o el incumplimiento de cualquier tercero en relación con los
        servicios anunciados o disponibles a través de la Plataforma.
      </p>
      <p>
        CHATEA CHEVERE no es responsable de las enfermedades, accidentes y/o lesiones corporales que
        se puedan presentar con ocasión de los servicios proveídos o productos comprados, por lo
        cual, tanto el USUARIO como el NEGOCIO asumen la exclusiva responsabilidad de los riesgos
        que se puedan presentar conociendo los riesgos inherentes a los servicios que están
        contratando o productos que se están adquiriendo.
      </p>
      <p>
        CHATEA CHEVERE no es responsable de los daños que se puedan presentar en las
        establecimientos o NEGOCIOS y que sean causados por el USUARIO. En caso de que se presenten,
        el USUARIO y el NEGOCIO deberán arreglar la situación de acuerdo con los términos y
        condiciones de uso de cada establecimiento.
      </p>
      <p>
        Por lo anterior, tanto el USUARIO como el NEGOCIO, liberan a CHATEA CHEVERE, a sus socios,
        funcionarios, asesores y empleados de toda responsabilidad relacionada con el uso tanto de
        la plataforma tecnológica como de los servicios especializados a utilizar con ocasión de
        esta plataforma.
      </p>

      <Divider />

      <Title level={3}>
        PROCEDIMIENTO PARA EL REGISTRO DE PETICIONES, QUEJAS, RECLAMOS Y SUGERENCIAS
      </Title>

      <p>
        <b>Petición</b>: Derecho de toda persona a presentar solicitudes respetuosas y obtener una
        solución.
      </p>
      <p>
        <b>Queja</b>: Manifestación de descontento o inconformidad que formula una persona en
        relación con la prestación de un servicio.
      </p>
      <p>
        <b>Reclamo</b>: Exigencia de los derechos del usuario relacionada con la prestación de un
        servicio.
      </p>
      <p>
        <b>Sugerencia</b>: Propuesta que se presenta para mejorar un proceso cuyo objeto está
        relacionado con la prestación de un servicio.
      </p>
      <p>
        Para ingresar una PQRS, el USUARIO deberá ingresar a la plataforma digital y registrar
        dentro de la opción Contacto/PQRS, su solicitud.
      </p>
      <p>
        Una vez diligenciada toda la información, CHATEA CHEVERE tendrá máximo un término de 15 días
        hábiles para dar respuesta al requerimiento.
      </p>
    </section>
  );
};

export default ServiceConditionsPage;
