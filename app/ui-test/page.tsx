'use client';
import {
  clearConversation,
  processMessage,
} from '@/services/tenants/cheefoodies/conversation-handler';
import { SendOutlined } from '@ant-design/icons';
import { Button, Card, Input, List, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const { Text, Paragraph } = Typography;

interface Message {
  type: 'user' | 'bot';
  content: string;
}

const ChatbotTester: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const testPhoneNumber = '573111234567'; // Número de prueba para simular la conversación

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    // 1. Agregar el mensaje del usuario al historial
    const userMessage: Message = { type: 'user', content: inputMessage };
    setMessages((prev) => [...prev, userMessage]);

    // 2. Procesar el mensaje con la función del chatbot
    const botResponse = processMessage(testPhoneNumber, inputMessage);

    // 3. Agregar la respuesta del bot al historial
    const botMessage: Message = { type: 'bot', content: botResponse };
    setMessages((prev) => [...prev, botMessage]);

    // 4. Limpiar el input
    setInputMessage('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Desplazar hacia abajo el chat
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage(); // Manejar el Enter
  };

  const resetConversation = () => {
    clearConversation(testPhoneNumber);
    const welcomeMessage = processMessage(testPhoneNumber, '');
    setMessages([{ type: 'bot', content: welcomeMessage }]);
  };

  return (
    <Card
      title="CheFoodie's Chatbot Test"
      className="w-[400px] my-8 mx-auto"
      extra={<Button onClick={resetConversation}>Reiniciar</Button>}
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
        onKeyDown={handleKeyPress}
        addonAfter={<Button icon={<SendOutlined />} onClick={sendMessage} />}
        style={{ marginTop: 10 }}
      />
    </Card>
  );
};

export default ChatbotTester;
