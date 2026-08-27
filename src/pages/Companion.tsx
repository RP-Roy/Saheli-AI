import { useState, useRef, useEffect } from 'react';
import {
  Send, Trash2, Shield, User, Loader2,
  RotateCcw, Sparkles, Navigation, ArrowRight,
  HelpCircle, Compass, Heart
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendMessage } from '../services/chatService';
import type { ChatMessage as Message } from '../services/gemini';
import { cn, formatTime } from '../utils/formatters';

const QUICK_PROMPTS = [
  { text: 'What should I do if I feel like I am being followed?', icon: Shield },
  { text: 'Give me practical safety tips for traveling alone at night.', icon: Navigation },
  { text: 'How can I de-escalate an uncomfortable confrontation?', icon: Sparkles },
  { text: 'What are the best habits for daily commuting safety?', icon: Compass },
  { text: 'Help me stay calm and guide me through this situation.', icon: Heart },
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
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] lg:h-[calc(100dvh-5.5rem)] max-w-4xl mx-auto w-full px-3 sm:px-6 py-2">
      {/* ── Main Chat Card ── */}
      <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-xl border border-pink-200/80 rounded-3xl overflow-hidden shadow-card">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-pink-100/80 bg-white/90 backdrop-blur-md flex-shrink-0">
          {/* Avatar with Status */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-rose-400 flex items-center justify-center shadow-soft-pink text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-400/30" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">Saheli AI</h1>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] bg-primary-50 text-primary-700 border border-primary-200/70 px-2.5 py-0.5 rounded-full font-bold">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-500" /> Safety Companion
              </span>
            </div>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online & ready to assist you
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="clear-chat-btn"
              onClick={clearChat}
              title="Clear conversation"
              className="w-9 h-9 rounded-xl bg-blush-50 hover:bg-blush-100 border border-pink-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all active:scale-95 shadow-sm"
              aria-label="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Messages List ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 space-y-4 sm:space-y-5 bg-gradient-to-b from-blush-50/40 via-white/50 to-blush-100/30">
          {messages.map(msg => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onNavigateRoute={() => navigate('/journey')}
              onNavigateLearn={() => navigate('/learn')}
            />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5 sm:gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-rose-400 flex items-center justify-center flex-shrink-0 shadow-sm text-white mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="bg-white border border-pink-100/90 px-4 py-3 rounded-2xl rounded-tl-sm shadow-[0_2px_8px_rgba(232,93,117,0.04)] flex items-center gap-1.5">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Error View */}
          {error && (
            <div className="mx-auto max-w-sm text-center px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex flex-col items-center gap-2 shadow-sm animate-fade-in">
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
          <div className="px-4 sm:px-6 pb-3 pt-2 flex-shrink-0 bg-white/80 border-t border-pink-100/60 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-primary-500" />
              <span>Suggested Topics</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p.text}
                  id={`quick-prompt-${p.text.slice(0, 15).replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => handleSend(p.text)}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-blush-50 border border-pink-200/80 text-xs font-semibold text-slate-700 hover:text-primary-700 hover:border-primary-300 transition-all whitespace-nowrap shadow-sm hover:shadow active:scale-95"
                >
                  <p.icon className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                  <span className="max-w-[260px] truncate">{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Bar ── */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-3 border-t border-pink-100 bg-white flex-shrink-0">
          <div className="flex items-end gap-2 sm:gap-3 bg-blush-50/70 border border-pink-200/80 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 focus-within:border-primary-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100 transition-all shadow-sm">
            <textarea
              ref={inputRef}
              id="companion-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Saheli anything about safety, routes, or guidance..."
              rows={1}
              className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none resize-none leading-relaxed max-h-32 py-1"
            />
            <button
              id="companion-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                input.trim() && !isLoading
                  ? 'bg-gradient-to-r from-primary-500 to-rose-500 hover:from-primary-600 hover:to-rose-600 active:scale-95 text-white shadow-soft-pink cursor-pointer'
                  : 'bg-pink-100/70 text-pink-300 cursor-not-allowed',
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-2 font-medium flex items-center justify-center gap-1">
            <Shield className="w-3 h-3 text-primary-400" />
            Saheli provides AI safety guidance. For immediate danger, always trigger SOS or call 112.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Message Bubble ──────────────────────────────────────────────────────

function ChatMessage({
  message,
  onNavigateRoute,
  onNavigateLearn: _onNavigateLearn
}: {
  message: Message;
  onNavigateRoute: () => void;
  onNavigateLearn: () => void;
}) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      'flex items-start gap-2.5 sm:gap-3 animate-fade-in group',
      !isAssistant ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm select-none',
        isAssistant
          ? 'bg-gradient-to-br from-primary-500 to-rose-400 text-white shadow-soft-pink'
          : 'bg-primary-100 border border-primary-200 text-primary-700',
      )}>
        {isAssistant ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Bubble Container - hugs content nicely, wraps at responsive max width */}
      <div className={cn(
        'flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%]',
        !isAssistant ? 'items-end' : 'items-start'
      )}>
        {/* Main Message Bubble */}
        <div className={cn(
          'w-fit px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-[13.5px] sm:text-sm leading-relaxed shadow-sm transition-all',
          isAssistant
            ? 'bg-white text-slate-800 border border-pink-100/90 rounded-tl-sm shadow-[0_2px_8px_rgba(232,93,117,0.04)]'
            : 'bg-gradient-to-br from-primary-500 to-rose-500 text-white rounded-tr-sm shadow-soft-pink font-medium'
        )}>
          <FormattedText text={message.content} isAssistant={isAssistant} />

          {/* Dynamic Route Recommendation Card in Chat */}
          {isAssistant && message.content.toLowerCase().includes('safer route') && (
            <div className="mt-3 p-3 rounded-xl bg-blush-50 border border-pink-200/80 flex items-center justify-between gap-3 shadow-inner-light">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Safe Route Planner</p>
                  <p className="text-[10px] text-slate-500">Analyze lit corridors & landmarks</p>
                </div>
              </div>
              <button
                onClick={onNavigateRoute}
                className="px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
              >
                <span>Open</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Timestamp footer inside bubble */}
          <div className={cn(
            'flex items-center gap-1 text-[10px] font-medium mt-1.5 pt-0.5 select-none',
            isAssistant ? 'text-slate-400 justify-start' : 'text-rose-100/90 justify-end'
          )}>
            <span>{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Formatted text (paragraphs, bold, lists) ────────────────────────────────

function FormattedText({ text, isAssistant }: { text: string; isAssistant: boolean }) {
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="space-y-2.5">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        
        // Check if paragraph is a list
        const isList = lines.length > 1 && lines.every(line => /^(\s*[-*•]|\s*\d+\.)\s+/.test(line.trim()));

        if (isList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-1 pl-0.5">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^(\s*[-*•]|\s*\d+\.)\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0',
                      isAssistant ? 'bg-primary-500' : 'bg-white'
                    )} />
                    <span className="flex-1">
                      <FormatInlineText text={cleanLine} isAssistant={isAssistant} />
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <span key={lIdx}>
                <FormatInlineText text={line} isAssistant={isAssistant} />
                {lIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function FormatInlineText({ text, isAssistant }: { text: string; isAssistant: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong
              key={i}
              className={cn(
                'font-bold',
                isAssistant ? 'text-slate-900' : 'text-white font-semibold'
              )}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
