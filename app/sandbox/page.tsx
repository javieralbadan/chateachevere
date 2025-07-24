'use client';
import { SendOutlined } from '@ant-design/icons';
import { Button, Card, Input, List, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import reactStringReplace from 'react-string-replace';

const { Text } = Typography;

interface Message {
  type: 'user' | 'bot';
  content: string;
}

const MESSAGE = {
  user: {
    align: 'text-right',
    color: '#e6f7ff',
    text: 'Tú:',
  },
  bot: {
    align: 'text-left',
    color: '#f6ffed',
    text: 'Bot:',
  },
};

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

  const testPhoneNumber = '573112223344'; // Número de prueba para simular la conversación
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    // 3. Agregar la respuesta del bot al historial
    const userMessage: Message = { type: 'user', content: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    // 1. Agregar el mensaje del usuario al historial
    try {
      const body = getBodyRequest(testPhoneNumber, inputMessage);
      // 2. Procesar el mensaje con la función del chatbot
      const res = await fetch('/api/whatsapp-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as { error?: string };
        throw new Error(errorData.error || 'Error al obtener respuesta del bot');
      }

      const data = (await res.json()) as { data: { response: string } };
      const botResponse = data?.data?.response;

      // 3. Agregar la respuesta del bot al historial
      const botMessage: Message = { type: 'bot', content: botResponse };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('UI TEST-Error al enviar mensaje:', error);
      const errorMessage: Message = { type: 'bot', content: 'Error en chatbot' };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Desplazar hacia abajo el chat
  }, [messages]);

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') await sendMessage(); // Manejar el Enter
  };

  return (
    <Card title="CheFoodie's Chatbot Test" className="w-[400px] my-8 mx-auto">
      <div className="h-[500px] overflow-y-scroll py-2 scrollbar-hide">
        <List
          dataSource={messages}
          renderItem={(item) => (
            <div className={`mb-4 ${MESSAGE[item.type].align}`}>
              <Card
                size="small"
                className="inline-block max-w-[80%] [&_.ant-card-body]:!py-2 border-none"
                style={{ backgroundColor: MESSAGE[item.type].color }}
              >
                <div className="whitespace-pre-wrap m-0">
                  <Text strong>{MESSAGE[item.type].text}</Text>
                  <br />
                  {reactStringReplace(item.content, /\*(.*?)\*/g, (match, i) => (
                    <Text strong key={i}>
                      {match}
                    </Text>
                  ))}
                </div>
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
