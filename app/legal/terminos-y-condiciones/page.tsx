'use client';
import LegalBreadcrumb from '@/components/atoms/LegalBreadcrumb';
import { Divider, Typography } from 'antd';
const { Title } = Typography;

const TermsAndConditionsPage = () => {
  return (
    <section className="legal-container">
      <LegalBreadcrumb currentPage="Términos y Condiciones" />

      <Title level={2}>TÉRMINOS Y CONDICIONES</Title>

      <Title level={3}>GLOSARIO</Title>
      <p>
        <b>CHATEA CHEVERE:</b> es una plataforma web que permite la automatización de la interacción
        entre NEGOCIOS y USUARIOS haciendo uso de la plataforma Whatsapp®️.
      </p>
      <p>
        <b>NEGOCIO:</b> Establecimiento presencial o digital que ofrece servicios, bienes
        y/productos dentro de la legislazción colombiana.
      </p>
      <p>
        <b>USUARIO(S):</b> clientes que actúan como tercero que tenga como objetivo la adquisición
        de servicios o productos en general. Son personas naturales que por medio de un smartphone o
        computador, y utiliza la aplicación Whatsapp®️ con dicha finalidad.
      </p>
      <p>
        Estos términos y condiciones regirán el uso de estos servicios. Se debe entender como
        servicio de CHATEA CHEVERE a la automatización de los chats de mensajería para el
        ofrecimiento, la consulta y/o adquisición de servicios y/o productos. Siendo este, el mero
        acuerdo entre NEGOCIOS y USUARIOS, sin abarcar la calidad del mismo, la duración, los
        insumos utilizados, los impactos generados como consecuencia del servicio, la no prestación
        del mismo.
      </p>
      <p>
        El servicio que presta CHATEA CHEVERE y cualquier otro servicio contenido en esta página web
        es para uso exclusivo de el USUARIO. El USUARIO no tiene ningún derecho, licencia o título
        que sea transferido por CHATEA CHEVERE.
      </p>

      <Divider />

      <Title level={3}>TÉRMINOS GENERALES</Title>
      <p>El USUARIO acepta utilizar el servicio siguiendo las siguientes pautas:</p>
      <p>El USUARIO debe tener más de 18 años y ser ciudadano de la República de Colombia.</p>
      <p>
        El USUARIO no puede publicar fotos o escribir comentarios sexualmente agresivos o que
        atenten contra el honor de otros USUARIOS.
      </p>
      <p>
        El USUARIO es el único responsable de cualquier actividad que ocurra bajo su nombre y en su
        cuenta.
      </p>
      <p>
        El USUARIO es responsable de mantener su contraseña de su dispositivo y de su app (en
        general todos sus datos) de forma segura.
      </p>
      <p>
        El USUARIO no puede utilizar esta página o los chats que se han automatizado para amenazar o
        intimidar a los USUARIOS del otro lado de la conversación.
      </p>
      <p>
        El USUARIO no podrá utilizar esta plataforma para la realización de cualquier actividad
        ilegal o no autorizada bajo las leyes de Colombia.
      </p>
      <p>
        El USUARIO no está autorizado para adaptar, modificar, transformar esta plataforma, ni los
        chats, ni cualquier otro producto digital o físico relacionado.
      </p>
      <p>
        El USUARIO acepta no crear trabajos derivados de la plataforma CHATEA CHEVERE y no remover,
        alterar, desactivar o degradar cualquier contenido dispuesto en esta.
      </p>
      <p>
        El USUARIO no deberá transmitir ningún tipo de virus o código de naturaleza destructiva.
      </p>
      <p>
        La violación de cualquiera de estos términos resultará en la terminación de la cuenta en la
        plataforma. Se prohíbe todo tipo de conducta ilegal dentro de la plataforma. CHATEA CHEVERE
        no se responsabiliza del contenido que sea escrito por cualquier persona que utilice la
        plataforma. En consecuencia, el USUARIO utiliza esta página bajo su propio riesgo y
        responsabilidad.
      </p>
    </section>
  );
};

export default TermsAndConditionsPage;
