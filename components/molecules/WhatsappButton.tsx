import { Button } from '../atoms/Button';

interface Props {
  message: string;
  buttonText: string;
  phone: string;
  variant?: 'primary' | 'inverted';
}

export const WhatsappButton = ({ message, buttonText, phone, variant }: Props) => {
  const textBase = `https://wa.me/${phone}?text=`;
  const fallbackMsg = 'Hola,%20me%20interesa%20el%20servicio%20de%20';
  const finalMsg = message.replace(' ', '%20') || fallbackMsg;

  return (
    <Button href={`${textBase}${finalMsg}`} variant={variant || 'primary'} target="_blank">
      {buttonText}
    </Button>
  );
};
