import React, { useState, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

// Define types for Web Speech API to fix TypeScript errors
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface InputAreaProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    // Cast window to any to access vendor-prefixed properties
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      const recog = new SpeechRecognitionCtor();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'pt-BR';

      recog.onstart = () => setIsListening(true);
      recog.onend = () => setIsListening(false);
      recog.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => prev ? `${prev} ${transcript}` : transcript);
      };
      
      setRecognition(recog);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-3 w-full bg-white p-2 md:p-3 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 transition-all focus-within:ring-4 ring-blue-50 ring-offset-2">
        
        {/* Real Voice Button */}
        <button 
          type="button" 
          onClick={toggleListening}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 shrink-0 ${
            isListening 
              ? 'bg-red-50 text-red-600 animate-pulse ring-2 ring-red-200' 
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-diga-primary'
          }`}
          aria-label={isListening ? "Parar gravação" : "Gravar áudio"}
          disabled={disabled}
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isListening ? "Ouvindo..." : "Digite aqui..."}
          className="flex-1 h-full bg-transparent text-lg text-gray-800 placeholder:text-gray-400 outline-none min-w-0 font-medium"
          disabled={disabled}
        />

        <button 
          type="submit" 
          disabled={!text.trim() || disabled}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-diga-primary text-white disabled:bg-gray-200 disabled:text-gray-400 hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:shadow-none shrink-0"
          aria-label="Enviar mensagem"
        >
          <Send size={22} className={!text.trim() ? "ml-0" : "ml-1"} />
        </button>
      </div>
    </form>
  );
};

export default InputArea;