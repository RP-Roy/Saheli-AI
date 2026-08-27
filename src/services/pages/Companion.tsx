import { useState, useRef, useEffect } from 'react';
import {
  Send, Trash2, ShieldHalf, User, Loader2,
  MessageSquare, BookOpen, Navigation, ChevronRight,
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendChatMessage, type ChatMessage as Message, SAHELI_SYSTEM_PROMPT as SYSTEM_PROMPT } from '../services/gemini';
import { SELF_DEFENSE_VIDEOS, getRecommendedResources } from '../data/selfDefenseVideos';
import { cn, formatTime } from '../utils/formatters';

const QUICK_PROMPTS = [
  'Why did you recommend this route?',
  'Is there a pharmacy on the way?',
  'Is there a police station near my route?',
  'Find another route with more public places.',
  'Teach me basic self-defense.',
];

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'assistant',
  content: "Hi! I'm **Saheli**, your personal safety companion 🛡️\n\nI'm here to help you stay safe, learn self-defense techniques, understand your journey confidence score, and be a supportive presence whenever you need it.\n\nHow can I help you today?",
  timestamp: new Date(),
};

export default function Companion() {
  const { journey } = useDemo();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      // Clean up the URL without triggering a re-render
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const history = messages.filter(m => m.id !== 'init');
      
      const contextData = journey.isActive ? {
        destination: journey.destination,
        routeSafetyScore: journey.routeSafetyScore,
        routeDuration: journey.etaMins,
        nearbySafetyPlaces: journey.safetyPoints,
      } : undefined;

      const reply = await sendChatMessage({ 
        messages: [...history, userMsg], 
        systemPrompt: SYSTEM_PROMPT,
        contextData 
      });
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Attach resource cards if asking about learning or specific situations
      if (/learn|self.?defense|beginner|video|resource|night|dark|follow|scared/i.test(content)) {
        let topic = '';
        if (/night|dark/i.test(content)) topic = 'night';
        else if (/follow|escape/i.test(content)) topic = 'escape';
        else if (/aware|watch/i.test(content)) topic = 'awareness';
        else if (/transport|bus|cab/i.test(content)) topic = 'transport';
        
        const resourceMsg: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `__RESOURCES__:${topic}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, resourceMsg]);
      }
    } catch {
      setError('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
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
    <div className="flex flex-col h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-4.5rem)]">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-white/10 bg-surface-900/80 backdrop-blur-sm flex-shrink-0">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary">
            <ShieldHalf className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-safe-500 rounded-full border-2 border-surface-900" />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white">Saheli</h1>
          <p className="text-xs text-safe-400 font-medium">Always here for you</p>
        </div>

        <div className="flex items-center gap-2">
          {journey.isActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-safe-500/15 border border-safe-500/30 rounded-lg text-[10px] font-semibold text-safe-300">
              <Navigation className="w-3 h-3" /> Journey Active
            </div>
          )}
          <button
            id="clear-chat-btn"
            onClick={clearChat}
            title="Clear chat"
            className="w-8 h-8 rounded-xl bg-surface-700 hover:bg-surface-600 border border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldHalf className="w-4 h-4 text-white" />
            </div>
            <div className="glass-card px-4 py-3 max-w-[300px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-sm text-center px-4 py-3 rounded-2xl bg-danger-500/10 border border-danger-500/30 text-sm text-danger-300">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Prompts ── */}
      {messages.length <= 2 && (
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                id={`quick-prompt-${p.slice(0, 15).replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => handleSend(p)}
                className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-surface-700/60 border border-white/10 text-xs text-slate-300 hover:text-white hover:border-primary-500/30 hover:bg-surface-700 transition-all whitespace-nowrap max-w-[200px] truncate"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="flex items-end gap-3 bg-surface-800 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-primary-500/40 transition-all">
          <textarea
            ref={inputRef}
            id="companion-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Saheli anything..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none resize-none leading-relaxed max-h-32"
          />
          <button
            id="companion-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
              input.trim() && !isLoading
                ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-glow-primary'
                : 'bg-surface-700 text-slate-600 cursor-not-allowed',
            )}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Quick Route Actions */}
        <div className="flex justify-center gap-3 mt-3">
          <button
            onClick={() => navigate('/journey')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-safe-500/10 border border-safe-500/30 text-xs font-semibold text-safe-300 hover:bg-safe-500/20 transition-colors"
          >
            <Navigation className="w-3 h-3" /> 
            {journey.isActive ? 'Recalculate Safer Route' : 'Find Safer Route'}
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-2">Saheli can make mistakes. For emergencies, call 112.</p>
      </div>
    </div>
  );
}

// ─── Chat Message ─────────────────────────────────────────────────────────────

function ChatMessage({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';

  // Resource cards message
  if (message.content.startsWith('__RESOURCES__')) {
    const topic = message.content.split(':')[1] || '';
    const resources = getRecommendedResources(topic).slice(0, 3);
    return (
      <div className="flex items-start gap-3 animate-fade-in">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldHalf className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 space-y-2 max-w-sm">
          <p className="text-xs text-slate-400 mb-2">Recommended resources for you:</p>
          {resources.map(v => (
            <a
              key={v.id}
              href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/60 border border-white/10 hover:border-primary-500/30 hover:bg-surface-700 transition-all group"
            >
              <img src={v.thumbnailUrl} alt={v.title} className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-1">{v.title}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{v.category} · {v.duration}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-3 animate-fade-in', !isAssistant && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
        isAssistant
          ? 'bg-gradient-to-br from-primary-500 to-accent-500'
          : 'bg-surface-700 border border-white/10',
      )}>
        {isAssistant
          ? <ShieldHalf className="w-4 h-4 text-white" />
          : <User className="w-4 h-4 text-slate-400" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
        isAssistant
          ? 'glass-card text-slate-200 rounded-tl-md'
          : 'bg-primary-600 text-white rounded-tr-md',
      )}>
        <FormattedText text={message.content} />
        <p className={cn('text-[10px] mt-2 opacity-50', isAssistant ? 'text-slate-400' : 'text-white')}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Formatted text (bold, newlines) ─────────────────────────────────────────

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>
          : part.split('\n').map((line, j) => (
              <span key={`${i}-${j}`}>{line}{j < part.split('\n').length - 1 && <br />}</span>
            ))
      )}
    </span>
  );
}
