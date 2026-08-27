import { useState, useRef, useEffect } from 'react';
import {
  Send, Trash2, ShieldHalf, User, Loader2,
  RotateCcw, Sparkles,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
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
  content: "Hi! I'm **Saheli**, your standalone AI safety & personal assistance companion 🛡️\n\nI'm here to provide calm advice, emergency guidance, situational awareness tips, de-escalation strategies, and everyday support whenever you need it.\n\nHow can I assist you right now?",
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
      <div className="flex-1 flex flex-col bg-surface-800/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/10 bg-surface-900/90 backdrop-blur-sm flex-shrink-0">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary">
              <ShieldHalf className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-safe-500 rounded-full border-2 border-surface-900" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white leading-tight">Saheli AI</h1>
              <span className="flex items-center gap-1 text-[10px] bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2 py-0.5 rounded-full font-medium">
                <Sparkles className="w-2.5 h-2.5" /> AI Assistant
              </span>
            </div>
            <p className="text-xs text-safe-400 font-medium">Always here to support & assist you</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="clear-chat-btn"
              onClick={clearChat}
              title="Clear chat"
              className="w-8 h-8 rounded-xl bg-surface-700 hover:bg-surface-600 border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
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
            <div className="mx-auto max-w-sm text-center px-4 py-3 rounded-2xl bg-danger-500/10 border border-danger-500/30 text-sm text-danger-300 flex flex-col items-center gap-2">
              <p>{error}</p>
              {lastPrompt && (
                <button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-700 hover:bg-surface-600 border border-white/10 rounded-lg text-xs text-white font-medium transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Retry
                </button>
              )}
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
                  className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-surface-700/60 border border-white/10 text-xs text-slate-300 hover:text-white hover:border-primary-500/30 hover:bg-surface-700 transition-all whitespace-nowrap max-w-[280px] truncate"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input ── */}
        <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-surface-900/60 flex-shrink-0">
          <div className="flex items-end gap-3 bg-surface-800 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-primary-500/40 transition-all">
            <textarea
              ref={inputRef}
              id="companion-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Saheli anything for safety & personal assistance..."
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

          <p className="text-center text-[10px] text-slate-500 mt-2">Saheli provides AI safety assistance. For immediate danger, call 112.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Message ─────────────────────────────────────────────────────────────

function ChatMessage({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';

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
