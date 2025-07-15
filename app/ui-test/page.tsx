'use client';
import { SendOutlined } from '@ant-design/icons';
import { Button, Card, Input, List, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const { Text, Paragraph } = Typography;

interface Message {
  type: 'user' | 'bot';
  content: string;
}

const getBodyRequest = (phoneNumber: string, inputMessage: string) => ({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '0',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            messages: [
              {
                from: phoneNumber,
                id: 'ABGGFlA5Fpa',
                timestamp: '1504902988',
                type: 'text',
                text: {
                  body: inputMessage,
                },
              },
            ],
          },
        },
      ],
    },
  ],
});

const ChatbotTester: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const testPhoneNumber = '573118551830'; // Número de prueba para simular la conversación
  console.log('🚀 ~ testPhoneNumber:', testPhoneNumber);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    console.log('🚀 ~ sendMessage ~ inputMessage:', inputMessage);
    // 1. Agregar el mensaje del usuario al historial
    try {
      const body = getBodyRequest(testPhoneNumber, inputMessage);
      console.log('🚀 ~ sendMessage ~ body:', body);
      // 2. Procesar el mensaje con la función del chatbot
      const res = await fetch('/api/whatsapp-webhook', {
        // Ruta de tu API Route
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData.error || 'Error al obtener respuesta del bot');
      }

      const data = (await res.json()) as { response: string };
      const botResponse = data.response;

      // 3. Agregar la respuesta del bot al historial
      const botMessage: Message = { type: 'bot', content: botResponse };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('UI TEST-Error al enviar mensaje:', error);
      const errorMessage: Message = {
        type: 'bot',
        content: 'Lo siento, hubo un error al procesar tu mensaje.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      // 4. Limpiar el input
      setInputMessage('');
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Desplazar hacia abajo el chat
  }, [messages]);

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') await sendMessage(); // Manejar el Enter
  };

  // const resetConversation = async () => {
  //   await UIClearConversation(testPhoneNumber);
  //   const welcomeMessage = await getResponseMessage(testPhoneNumber, '');
  //   setMessages([{ type: 'bot', content: welcomeMessage }]);
  // };

  return (
    <Card
      title="CheFoodie's Chatbot Test"
      className="w-[400px] my-8 mx-auto"
      // extra={<Button onClick={() => void resetConversation()}>Reiniciar</Button>}
    >
      <div className="h-[500px] overflow-y-scroll py-2 scrollbar-hide">
        <List
          dataSource={messages}
          renderItem={(item) => (
            <div className={`mb-4 ${item.type === 'user' ? 'text-right' : 'text-left'}`}>
              <Card
                size="small"
                style={{
                  display: 'inline-block',
                  maxWidth: '80%',
                  backgroundColor: item.type === 'user' ? '#e6f7ff' : '#f6ffed',
                  border: 'none',
                }}
              >
                <Paragraph className="whitespace-pre-wrap m-0">
                  <Text strong>{item.type === 'user' ? 'Tú:' : 'Bot:'}</Text>
                  <br />
                  {item.content}
                </Paragraph>
              </Card>
            </div>
          )}
        />
        <div ref={chatEndRef} />
      </div>

      <Input
        placeholder="Escribe un mensaje (ej. 1)"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => {
          void handleKeyPress(e);
        }}
        addonAfter={
          <Button
            icon={<SendOutlined />}
            onClick={() => {
              void sendMessage();
            }}
          />
        }
        style={{ marginTop: 10 }}
      />
    </Card>
  );
};

export default ChatbotTester;
