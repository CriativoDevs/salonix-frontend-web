import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { useTenant } from '../hooks/useTenant';
import { describeFeatureRequirement } from '../constants/tenantFeatures';

function Chat() {
  const { t } = useTranslation();
  const { flags, plan } = useTenant();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');

  // Mock data - em produção viria da API
  const chats = [
    {
      id: 1,
      client: 'Maria Silva',
      lastMessage: 'Olá, gostaria de agendar um horário',
      time: '10:30',
      unread: 2,
    },
    {
      id: 2,
      client: 'João Santos',
      lastMessage: 'Perfeito, até amanhã!',
      time: '09:15',
      unread: 0,
    },
    {
      id: 3,
      client: 'Ana Costa',
      lastMessage: 'Qual o valor do serviço?',
      time: 'Ontem',
      unread: 1,
    },
  ];

  const webPushEnabled = flags?.enableWebPush !== false;
  const webPushRequirement = !webPushEnabled
    ? describeFeatureRequirement('enableWebPush', plan?.name)
    : null;

  const messages = selectedChat
    ? [
        {
          id: 1,
          text: 'Olá, gostaria de agendar um horário',
          sender: 'client',
          time: '10:30',
        },
        {
          id: 2,
          text: 'Claro! Que dia você prefere?',
          sender: 'professional',
          time: '10:32',
        },
        {
          id: 3,
          text: 'Amanhã às 14h seria possível?',
          sender: 'client',
          time: '10:35',
        },
        {
          id: 4,
          text: 'Perfeito! Confirmado para amanhã às 14h',
          sender: 'professional',
          time: '10:36',
        },
      ]
    : [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    // TODO: implementar envio de mensagem
    console.log('Enviar mensagem:', message);
    setMessage('');
  };

  return (
    <FullPageLayout>
      <PageHeader title={t('chat.title')} subtitle={t('chat.subtitle')} />

      {!webPushEnabled ? (
        <Card className="px-4 py-3">
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <strong>{webPushRequirement?.label || t('chat.webpush_locked', 'Web Push indisponível')}</strong>
            <p className="mt-1">
              {webPushRequirement?.description ||
                t(
                  'chat.webpush_locked_description',
                  'Atualize o plano para enviar notificações e mensagens automáticas.'
                )}
            </p>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de chats */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('chat.conversations')}
            </h3>
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedChat?.id === chat.id
                      ? 'bg-brand-50 border border-brand-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {chat.client}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-xs text-gray-500">{chat.time}</span>
                      {chat.unread > 0 && (
                        <span className="bg-brand-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Área de mensagens */}
        <div className="lg:col-span-2">
          <Card className="p-4 h-96 flex flex-col">
            {selectedChat ? (
              <>
                {/* Header do chat */}
                <div className="border-b border-gray-200 pb-3 mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedChat.client}
                  </h3>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'client' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                          msg.sender === 'client'
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-brand-500 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender === 'client'
                              ? 'text-gray-500'
                              : 'text-brand-100'
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input de mensagem */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('chat.type_message')}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('chat.send')}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>{t('chat.select_conversation')}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </FullPageLayout>
  );
}

export default Chat;
