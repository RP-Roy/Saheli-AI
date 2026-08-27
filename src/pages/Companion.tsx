import { useState, useRef, useEffect } from 'react';
import {
  Send, Trash2, Shield, User, Loader2,
  RotateCcw, Sparkles, Navigation, Play, ArrowRight
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendMessage } from '../services/chatService';
import type { ChatMessage as Message } from '../services/gemini';
import { cn, formatTime } from '../utils/formatters';

const QUICK_PROMPTS = [
  'What should I do if I feel like I am being followed?',
  'Give me practical safety tips for traveling alone at night.',
  'How can I de-escalate an uncomfortable confrontation?',
  'What are the best habits for daily commuting safety?',
  'Help me stay calm and guide me through this situation.',
];

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'assistant',
  content: "Hi! I'm **Saheli**, your predictive safety & personal companion 🌸\n\nI'm here to provide calm advice, real-time safety strategies, de-escalation tips, self-defense guidance, and route recommendations whenever you need reassurance.\n\nHow can I help you feel safer today?",
  timestamp: new Date(),
};

export default function Companion() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialPrompt = params.get('prompt');
    if (initialPrompt && messages.length === 1) {
      handleSend(initialPrompt);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    setLastPrompt(content);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const history = messages
        .filter(m => m.id !== 'init')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await sendMessage({
        message: content,
        conversationHistory: history,
      });

      if (!response.success && response.error) {
        throw new Error(response.error);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err?.message || 'Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastPrompt) {
      handleSend(lastPrompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => setMessages([INITIAL_MESSAGE]);

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-5rem)] max-w-4xl mx-auto w-full px-3 sm:px-6 py-2">
      {/* ── Main Chat Card ── */}
      <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-xl border border-pink-200/80 rounded-3xl overflow-hidden shadow-card">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-pink-100 bg-white/80 backdrop-blur-md flex-shrink-0">
          {/* Breathing Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-rose-400 flex items-center justify-center shadow-soft-pink">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">Saheli AI</h1>
              <span className="flex items-center gap-1 text-[10px] bg-primary-50 text-primary-700 border border-primary-200/70 px-2.5 py-0.5 rounded-full font-bold">
                <Sparkles className="w-2.5 h-2.5" /> Safety Companion
              </span>
            </div>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">Online & ready to assist you</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="clear-chat-btn"
              onClick={clearChat}
              title="Clear conversation"
              className="w-9 h-9 rounded-2xl bg-blush-50 hover:bg-blush-100 border border-pink-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Messages List ── */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-blush-100/30">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} onNavigateRoute={() => navigate('/journey')} onNavigateLearn={() => navigate('/learn')} />
          ))}

          {isLoading && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary-500 to-rose-400 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-pink-200/70 px-4 py-3 rounded-3xl rounded-tl-md shadow-sm max-w-[280px]">
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-sm text-center px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex flex-col items-center gap-2">
              <p>{error}</p>
              {lastPrompt && (
                <button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-100 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold transition-colors shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" /> Retry Prompt
                </button>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Prompts Pills ── */}
        {messages.length <= 2 && (
          <div className="px-5 pb-3 pt-2 flex-shrink-0 bg-white/95 border-t border-pink-50">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  id={`quick-prompt-${p.slice(0, 15).replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => handleSend(p)}
                  className="flex-shrink-0 px-4 py-2 rounded-2xl bg-blush-50 hover:bg-blush-100 border border-pink-200/80 text-xs font-semibold text-slate-700 hover:text-primary-700 transition-all whitespace-nowrap max-w-[280px] truncate shadow-sm hover:-translate-y-0.5 active:scale-95"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Bar ── */}
        <div className="px-5 pb-5 pt-3 border-t border-pink-100 bg-white flex-shrink-0">
          <div className="flex items-end gap-3 bg-blush-50/70 border border-pink-200/80 rounded-2xl px-4 py-3 focus-within:border-primary-400 focus-within:bg-white transition-all shadow-sm">
            <textarea
              ref={inputRef}
              id="companion-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Saheli anything about safety, routes, or guidance..."
              rows={1}
              className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none resize-none leading-relaxed max-h-32"
            />
            <button
              id="companion-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                input.trim() && !isLoading
                  ? 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-soft-pink hover:scale-105 active:scale-95'
                  : 'bg-pink-100 text-pink-300 cursor-not-allowed',
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">Saheli provides AI safety guidance. For immediate danger, always trigger SOS or call 112.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Message Bubble ──────────────────────────────────────────────────────

function ChatMessage({
  message,
  onNavigateRoute,
  onNavigateLearn
}: {
  message: Message;
  onNavigateRoute: () => void;
  onNavigateLearn: () => void;
}) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn('flex items-start gap-3 animate-fade-in', !isAssistant && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm',
        isAssistant
          ? 'bg-gradient-to-br from-primary-500 to-rose-400 text-white'
          : 'bg-blush-200 border border-pink-300 text-primary-700',
      )}>
        {isAssistant
          ? <Shield className="w-4 h-4" />
          : <User className="w-4 h-4" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[80%] px-4.5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-sm',
        isAssistant
          ? 'bg-white text-slate-800 border border-pink-200/80 rounded-tl-md'
          : 'bg-primary-500 text-white rounded-tr-md font-medium shadow-soft-pink',
      )}>
        <FormattedText text={message.content} isAssistant={isAssistant} />

        {/* Dynamic Route Recommendation Card in Chat */}
        {isAssistant && message.content.toLowerCase().includes('safer route') && (
          <div className="mt-3 p-3 rounded-2xl bg-blush-50 border border-pink-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Safe Route Planner</p>
                <p className="text-[10px] text-slate-500">Analyze lit corridors & landmarks</p>
              </div>
            </div>
            <button
              onClick={onNavigateRoute}
              className="px-3 py-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <span>Open</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        <p className={cn('text-[10px] mt-2 opacity-60 font-semibold', isAssistant ? 'text-slate-400' : 'text-white')}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Formatted text (bold, newlines) ─────────────────────────────────────────

function FormattedText({ text, isAssistant }: { text: string; isAssistant: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className={cn('font-extrabold', isAssistant ? 'text-slate-900' : 'text-white')}>{part.slice(2, -2)}</strong>
          : part.split('\n').map((line, j) => (
              <span key={`${i}-${j}`}>{line}{j < part.split('\n').length - 1 && <br />}</span>
            ))
      )}
    </span>
  );
}
