import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useBicameralLoop } from './useBicameralLoop';
import { useOntologyStore } from './store';
import { Send, Pickaxe, Download, Upload, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

const FORGE_PLACEHOLDERS = [
  "You are a dense, deeply technical navigator terminal set in the year 2085. You see through a simulated monochrome HUD. Speak plainly and quickly, utilizing short fragments. Avoid emotional padding.",
  "You are a mystical, ancient archivist bound within a crystalline structure. You speak in riddles, using expansive and highly poetic language. You remember the old world but struggle to understand the present.",
  "You are a hyper-optimistic personal assistant in a futuristic utopian city. You answer every query with boundless enthusiasm, using clear, structured, and bullet-pointed advice. You always try to be helpful."
];

export default function App() {
  const { sendMessage, isLoading, error } = useBicameralLoop();
  const appPhase = useOntologyStore((state) => state.appPhase);
  const initializeWorld = useOntologyStore((state) => state.initializeWorld);
  const resetWorld = useOntologyStore((state) => state.resetWorld);
  const loadBlueprint = useOntologyStore((state) => state.loadBlueprint);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [forgeInput, setForgeInput] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [forgeError, setForgeError] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync state messages properly on load
  const storeChatHistory = useOntologyStore((state) => state.chatHistory);
  useEffect(() => {
    if (appPhase === 'PLAYGROUND' && storeChatHistory && storeChatHistory.length > 0) {
       // Only map if messages is currently empty (initial load after refresh)
       if (messages.length === 0) {
         setMessages(storeChatHistory.map(m => ({ id: crypto.randomUUID(), role: m.role==='model'?'bot':'user', content: m.content })));
       }
    }
  }, [appPhase, storeChatHistory, messages.length]);

  // Trigger the Opening Move when entering Playground with an empty chat history
  useEffect(() => {
    const state = useOntologyStore.getState();
    if (state.appPhase === 'PLAYGROUND' && state.chatHistory.length === 0 && !isLoading) {
       sendMessage('__SYSTEM_INIT__')
         .then((reply) => {
           setMessages([{ id: crypto.randomUUID(), role: 'bot', content: reply }]);
         })
         .catch(console.error);
    }
  }, [appPhase]);

  const handleCyclePlaceholder = () => {
    setPlaceholderIdx((prev) => (prev + 1) % FORGE_PLACEHOLDERS.length);
  };

  const handleForgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForging) return;
    
    const finalPrompt = forgeInput.trim() || FORGE_PLACEHOLDERS[placeholderIdx];
    
    setIsForging(true);
    setForgeError('');
    try {
      const res = await fetch(`${window.location.origin}/api/forge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedPrompt: finalPrompt }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to process seed prompt in the Forge.');
      }
      const { baselineState } = await res.json();
      initializeWorld(baselineState);
    } catch (err: any) {
      setForgeError(err.message || String(err));
    } finally {
      setIsForging(false);
    }
  };

  const handleExportBlueprint = () => {
    const state = useOntologyStore.getState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `chatbud-blueprint-${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportBlueprint = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadBlueprint(json);
      } catch (err) {
        setForgeError("Invalid blueprint file format.");
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  const [flushState, setFlushState] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSystemFlush = () => {
    if (confirm("Are you sure you want to permanently purge all active memory, chat logs, and cached world parameters? This cannot be undone.")) {
      try {
        useOntologyStore.getState().flushStore();
        localStorage.removeItem('chatbud-ontology-persistence');
        setFlushState('success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error("Flush failed:", err);
        setFlushState('error');
      }
    }
  };

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

  if (appPhase === 'BOOT') {
    return (
      <div className="flex flex-col h-screen bg-zinc-950 text-zinc-400 font-sans items-center justify-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-zinc-800/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-xl flex flex-col bg-[#0c0c0e]/80 sm:border sm:border-zinc-800/50 sm:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:rounded-3xl p-12 text-center items-center z-10 backdrop-blur-sm">
          <div className="w-20 h-20 rounded-full border border-zinc-700/50 bg-zinc-900/50 flex items-center justify-center mb-8 shadow-inner">
            <span className="text-zinc-500 tracking-[0.2em] text-[10px] uppercase font-mono">System</span>
          </div>
          <h1 className="text-2xl font-light tracking-[0.2em] text-zinc-300 mb-4 uppercase">Bicameral Void</h1>
          <p className="text-zinc-500 text-sm mb-12 max-w-sm leading-relaxed">
            Initialize a new sandbox environment or permanently purge local memory cache.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
               onClick={() => useOntologyStore.getState().startForge()}
               className="bg-zinc-200 text-zinc-900 hover:bg-white px-8 py-3 rounded-full text-sm font-medium transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] tracking-wide"
            >
               Initialize Forge
            </button>
            <button
               onClick={handleSystemFlush}
               className="bg-red-950/20 text-red-500 border border-red-900/30 hover:bg-red-900/40 px-8 py-3 rounded-full text-sm font-medium transition-all tracking-wide"
            >
               Flush Memory
            </button>
          </div>
          
          {/* Graphical Feedback */}
          <div className="h-8 mt-6">
            {flushState === 'success' && (
              <p className="text-green-500/80 text-xs tracking-widest uppercase animate-pulse">
                [ Memory Purged. Rebooting... ]
              </p>
            )}
            {flushState === 'error' && (
              <p className="text-red-500/80 text-xs tracking-widest uppercase">
                [ Flush Failed ]
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (appPhase === 'FORGE') {
    return (
      <div className="flex flex-col h-screen bg-zinc-950 text-zinc-400 font-sans sm:px-4 sm:py-6 lg:px-8 items-center justify-center">
        <div className="w-full max-w-3xl flex flex-col bg-[#0c0c0e] sm:border sm:border-zinc-800/50 sm:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:rounded-3xl p-8 relative">
          
          <div className="absolute top-4 right-4">
             <label className="cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 text-xs font-medium bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full shadow-sm">
                <Upload className="w-3.5 h-3.5 text-zinc-400" />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={handleImportBlueprint} className="hidden" />
             </label>
          </div>

          <div className="flex items-center justify-center mb-8 gap-3 mt-4">
            <Pickaxe className="w-6 h-6 text-zinc-500" />
            <h1 className="text-zinc-600 text-sm tracking-[0.2em] uppercase font-medium">The Seed Forge</h1>
          </div>
          <p className="text-zinc-500 text-sm text-center mb-8 px-4 leading-relaxed">
            Provide a configuration script, character profile, or sandbox ruleset. The Forge will compile your intent into a baseline state object.
          </p>
          <form onSubmit={handleForgeSubmit} className="flex flex-col gap-6">
            <div className="relative">
              <textarea
                className="w-full h-40 bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-4 text-zinc-300 text-sm focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 resize-none shadow-inner shadow-black/20"
                placeholder={FORGE_PLACEHOLDERS[placeholderIdx]}
                value={forgeInput}
                onChange={(e) => setForgeInput(e.target.value)}
                disabled={isForging}
              />
              <button 
                 type="button" 
                 title="Cycle Placeholder"
                 onClick={handleCyclePlaceholder} 
                 className="absolute bottom-4 right-4 text-zinc-600 hover:text-zinc-300 transition-colors bg-zinc-800/80 p-1.5 rounded-full"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {forgeError && <p className="text-red-900/60 text-xs text-center">{forgeError}</p>}
            <button
              type="submit"
              disabled={isForging}
              className="self-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-300 px-8 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
            >
              {isForging ? 'Compiling...' : (forgeInput.trim() ? 'Initialize World' : 'Use Placeholder & Initialize')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-400 font-sans sm:px-4 sm:py-6 lg:px-8 items-center justify-center">
      <div className="w-full max-w-3xl flex flex-col h-full bg-[#0c0c0e] sm:border sm:border-zinc-800/50 sm:shadow-[0_0_40px_rgba(0,0,0,0.5)] sm:rounded-3xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-6 border-b border-zinc-800/30">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => { setMessages([]); resetWorld(); }}
              className="text-zinc-600 hover:text-zinc-400 text-xs font-medium uppercase tracking-wider"
            >
              Reset
            </button>
            <button 
              type="button"
              onClick={handleSystemFlush}
              className="text-red-500/80 hover:text-red-400 transition-colors text-[10px] font-medium uppercase tracking-wider"
            >
              Flush
            </button>
          </div>
          <h1 className="text-zinc-600 text-[10px] tracking-[0.2em] uppercase font-medium">Bicameral Void</h1>
          <button
            onClick={handleExportBlueprint}
            className="text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider"
            title="Download JSON Blueprint"
          >
             <Download className="w-3.5 h-3.5" />
             <span>Export</span>
          </button>
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
