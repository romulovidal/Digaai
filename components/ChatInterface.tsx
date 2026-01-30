import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import InputArea from './InputArea';
import { Bot, User, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onConfirmTransaction: (messageId: string, confirmed: boolean) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onConfirmTransaction,
  isLoading 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full relative max-w-3xl mx-auto w-full overflow-hidden">
      
      {/* Header - Mobile Only */}
      <header className="md:hidden p-4 bg-white/0 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-gray-400 bg-white/80 backdrop-blur-md px-4 py-1 rounded-full shadow-sm">Chat</span>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:px-0 space-y-6 scroll-smooth no-scrollbar" ref={scrollRef}>
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 animate-in zoom-in duration-500">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 text-diga-primary shadow-[0_10px_40px_-10px_rgba(79,70,229,0.2)]">
                <Sparkles size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 tracking-tight">Oi, vamos conversar?</h2>
            <p className="text-gray-500 max-w-xs leading-relaxed text-sm md:text-base">
              Diga seus gastos ou ganhos naturalmente.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div 
              className={`max-w-[85%] md:max-w-[75%] px-5 py-3 md:px-6 md:py-4 rounded-[1.5rem] text-sm md:text-lg shadow-sm
                ${msg.sender === 'user' 
                  ? 'bg-diga-primary text-white rounded-br-none shadow-indigo-500/20' 
                  : 'bg-white text-gray-700 rounded-bl-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

              {/* Transaction Confirmation Card within Chat */}
              {msg.isDraft && msg.draftData && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="bg-black/5 p-4 rounded-xl mb-3">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-xs opacity-60 font-bold uppercase">{msg.draftData.category}</span>
                    </div>
                    <span className="font-bold text-2xl tracking-tight block">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(msg.draftData.amount || 0)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onConfirmTransaction(msg.id, true)}
                      className="flex-1 bg-white text-diga-primary py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-sm active:scale-95 text-sm"
                    >
                      Confirmar
                    </button>
                    <button 
                        onClick={() => onConfirmTransaction(msg.id, false)}
                        className="px-4 bg-transparent text-white/80 border border-white/20 py-3 rounded-xl font-bold hover:bg-white/10 transition-all active:scale-95 text-sm"
                    >
                      X
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Now Flex Child, not Absolute */}
      {/* Added bottom padding for mobile safe area / bottom nav clearance */}
      <div id="chat-input-area" className="shrink-0 z-30 px-4 md:px-0 pt-4 pb-28 md:pb-6 bg-gradient-to-t from-diga-bg via-diga-bg to-transparent">
        <InputArea onSend={onSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default ChatInterface;