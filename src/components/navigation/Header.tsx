import { ShieldHalf, Bell } from 'lucide-react';
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
    <header className="sticky top-0 z-20 bg-surface-900/90 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mr-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary">
            <ShieldHalf className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">Saheli AI</span>
        </div>

        {/* Page title (desktop) */}
        {title && (
          <h2 className="hidden lg:block font-semibold text-white text-base">{title}</h2>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* Journey status pill */}
          {journey.isActive && (
            <RiskBadge level={journey.riskLevel} className="hidden sm:flex" />
          )}

          {/* Notifications */}
          <button
            id="header-notifications"
            className="relative w-8 h-8 rounded-lg bg-surface-700 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-600 transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {journey.incidents.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {journey.incidents.length}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user.avatar}
          </div>
        </div>
      </div>
    </header>
  );
}
