import { useState, useRef, useEffect } from 'react';
import { useBicameralLoop } from './useBicameralLoop';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

export default function App() {
  const { sendMessage, isLoading, error } = useBicameralLoop();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: userText };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const reply = await sendMessage(userText);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'bot', content: reply }]);
    } catch (err) {
      // Error is handled by the hook and exposed via `error` state
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-400 font-sans sm:px-4 sm:py-6 lg:px-8 items-center justify-center">
      <div className="w-full max-w-3xl flex flex-col h-full bg-[#0c0c0e] sm:border sm:border-zinc-800/50 sm:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:rounded-3xl overflow-hidden relative">
        {/* Header - Subtle */}
        <div className="flex items-center justify-center py-5 border-b border-zinc-800/30">
          <h1 className="text-zinc-600 text-[10px] tracking-[0.2em] uppercase font-medium">Bicameral Void</h1>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-sm font-light space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] border border-zinc-800/10 mb-4 animate-[pulse_4s_ease-in-out_infinite]">
                <div className="w-2 h-2 rounded-full bg-zinc-700/50 shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
              </div>
              <p>The void awaits your first whisper...</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] px-5 py-4 text-[15px] leading-relaxed shadow-sm
                  ${
                    msg.role === 'user'
                      ? 'bg-zinc-900 text-zinc-300 rounded-3xl rounded-br-sm shadow-black/20 border border-zinc-800/40'
                      : 'bg-zinc-800/30 text-zinc-300 rounded-3xl rounded-bl-sm border border-zinc-800/30 shadow-black/10'
                  }
                `}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="max-w-[85%] sm:max-w-[75%] px-5 py-4 text-sm bg-zinc-800/20 text-zinc-500 rounded-3xl rounded-bl-sm border border-zinc-800/30 flex items-center space-x-3">
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-transparent border-t border-zinc-800/30">
          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-zinc-900/60 border border-zinc-800/50 rounded-full px-4 py-2 hover:border-zinc-700/50 focus-within:border-zinc-700/60 focus-within:ring-1 focus-within:ring-zinc-700/50 transition-all shadow-inner shadow-black/20"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none px-2 py-2"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 text-zinc-600 hover:text-zinc-400 disabled:opacity-30 transition-colors rounded-full"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
          {error && (
            <p className="text-red-900/60 text-xs text-center mt-3">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
