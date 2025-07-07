import { DateTime, Settings } from 'luxon';

Settings.defaultZone = 'America/Bogota';
Settings.defaultLocale = 'es';

const DEFAULT = {
  LANGUAGE: 'es-CO',
  CURRENCY: 'COP',
};

interface CurrencyProps {
  value: number;
  options?: Intl.NumberFormatOptions;
}

export const formatTime = ({ dateTime: time }: { dateTime: DateTime }): string => {
  const formattedTime = time.toFormat('h:mm a'); // Formato 12 horas (10:30 a. m. | 7:30 p. m.)
  const finalTime = formattedTime.replace(/\.\s?/g, '').replace(/\s/g, ' ');
  // 10:30 am | 7:30 pm
  return finalTime;
};

export const RENDER_FORMAT = {
  // TODO: Check the initial zero
  // prettier-ignore
  default: 'EEEE, dd \'de\' LLLL, h:mm a', // Jueves, 12 de junio, 05:04 p. m.
  // prettier-ignore
  dateOnly: 'EEEE, dd \'de\' LLLL', // Jueves, 12 de junio
  timeOnly: 'h:mm a', // 05:04 p. m.
};

type RenderFormatType = keyof typeof RENDER_FORMAT;

export const renderDateTime = (
  dateString: string | undefined,
  zone: string = 'America/Bogota',
  format: RenderFormatType = 'default',
) => {
  if (!dateString) return '';

  const dt = DateTime.fromISO(dateString).setZone(zone);
  if (!dt.isValid) {
    console.error('renderDateTime error - dateString:', { dateString, zone, format });
    return '';
  }

  return dt.toFormat(RENDER_FORMAT[format]);
};

export const getIDFromDateTime = (dateTime: DateTime): string => {
  // prettier-ignore
  return dateTime.toFormat('yyyy-MM-dd\'T\'H:mm'); // Formato ISO para el ID
};

const DEFAULT_CURRENCY_OPTIONS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: DEFAULT.CURRENCY,
  maximumSignificantDigits: 3,
};

export const formatCurrency = ({ value, options = DEFAULT_CURRENCY_OPTIONS }: CurrencyProps) => {
  if (!value) {
    return '';
  }

  const formatter = new Intl.NumberFormat(DEFAULT.LANGUAGE, options);
  return formatter.format(value);
};

export const formatPhoneNumber = (phone: string): string => {
  const phoneStr = String(phone);
  const cleanPhone = phoneStr.replace(/\D/g, '');

  if (cleanPhone.length === 10) {
    // Número local colombiano sin indicativo, agregar 57
    return '57' + cleanPhone;
  } else if (cleanPhone.length === 12) {
    // Número con indicativo (Colombia u otro país)
    return cleanPhone;
  } else {
    // Otros casos
    return cleanPhone;
  }
};
