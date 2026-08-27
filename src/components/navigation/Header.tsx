import { Shield, Bell } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { useApp } from '../../context/AppContext';
import { RiskBadge } from '../ui/Badge';

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { journey } = useDemo();
  const { user } = useApp();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-pink-200/70 shadow-[0_2px_12px_rgba(232,93,117,0.03)]">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mr-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-rose-400 flex items-center justify-center shadow-soft-pink">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">Saheli AI</span>
        </div>

        {/* Page title (desktop) */}
        {title && (
          <h2 className="hidden lg:block font-bold text-slate-800 text-base tracking-tight">{title}</h2>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* Journey status pill */}
          {journey.isActive && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Active Safe Journey
              </span>
            </div>
          )}

          {/* Notifications */}
          <button
            id="header-notifications"
            className="relative w-9 h-9 rounded-xl bg-white border border-pink-200/80 shadow-sm flex items-center justify-center text-slate-600 hover:text-primary-600 hover:border-primary-300 transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {journey.incidents.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold shadow-sm">
                {journey.incidents.length}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-rose-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-soft-pink">
            {user.avatar}
          </div>
        </div>
      </div>
    </header>
  );
}
