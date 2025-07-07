import { AuthComponentsType, UtilityComponentsType } from './messages';

// TODO: Check how to merge with types/message.ts
export interface WhatsAppTextMessage {
  to: string;
  message: string;
}

export interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  components: AuthComponentsType | UtilityComponentsType;
  languageCode?: string;
}

// ********* META API *********

interface BaseWhatsAppRequest {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
}

export interface WhatsAppTextRequest extends BaseWhatsAppRequest {
  type: 'text';
  text: {
    body: string;
  };
}

export interface WhatsAppTemplateRequest extends BaseWhatsAppRequest {
  type: 'template';
  template: {
    language: {
      code: string;
    };
    name: string;
    components: AuthComponentsType | UtilityComponentsType;
  };
}

// ********* META API - WEBHOOK *********

type MessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'location'
  | 'contacts'
  | 'interactive';

// Interface para el contenido de un mensaje de texto
interface TextContent {
  body: string;
}

// Interface para metadatos del mensaje
interface MessageMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

// Interface para un mensaje individual
interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: MessageType;
  text?: TextContent;
  // Puedes agregar otros tipos de contenido según necesites
  image?: { id: string; mime_type: string; sha256: string };
  audio?: { id: string; mime_type: string; sha256: string };
  video?: { id: string; mime_type: string; sha256: string };
  document?: { id: string; mime_type: string; sha256: string; filename: string };
}

// Interface para el valor del cambio
interface ChangeValue {
  messaging_product: 'whatsapp';
  metadata: MessageMetadata;
  contacts?: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
  messages?: WhatsAppMessage[];
  statuses?: Array<{
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
  }>;
}

// Interface para un cambio individual
interface Change {
  value: ChangeValue;
  field: 'messages' | 'message_template_status_update';
}

// Interface para una entrada individual
interface Entry {
  id: string;
  changes: Change[];
}

// Interface principal para el webhook body
export interface WhatsAppWebhookBody {
  object: 'whatsapp_business_account';
  entry: Entry[];
}
