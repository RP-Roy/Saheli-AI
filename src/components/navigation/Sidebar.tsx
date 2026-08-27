import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Navigation, BookOpen, MessageCircle,
  AlertOctagon, Settings, ShieldHalf, FlaskConical
} from 'lucide-react';
import { useDemo } from '../../context/DemoContext';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/formatters';

const NAV_ITEMS = [
  { to: '/',          label: 'Home',       icon: LayoutDashboard, end: true  },
  { to: '/journey',   label: 'Journey',    icon: Navigation,      end: false },
  { to: '/learn',     label: 'Learn',      icon: BookOpen,        end: false },
  { to: '/companion', label: 'Saheli',     icon: MessageCircle,   end: false },
  { to: '/emergency', label: 'Emergency',  icon: AlertOctagon,    end: false, danger: true },
  { to: '/settings',  label: 'Settings',   icon: Settings,        end: false },
];

export function Sidebar() {
  const { isDemoMode, toggleDemoMode } = useDemo();
  const { user } = useApp();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-surface-800 border-r border-white/10 fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-glow-primary">
          <ShieldHalf className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Saheli AI</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Safety Companion</p>
        </div>
        {isDemoMode && (
          <div className="ml-auto flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 rounded-lg px-1.5 py-0.5">
            <FlaskConical className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-bold text-amber-300">DEMO</span>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, danger }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            id={`nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? danger
                    ? 'bg-danger-600/20 text-danger-300 border border-danger-500/30'
                    : 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                  : danger
                  ? 'text-danger-400/70 hover:text-danger-300 hover:bg-danger-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5',
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Demo Mode toggle */}
      <div className="px-3 py-3 border-t border-white/10">
        <button
          onClick={toggleDemoMode}
          id="demo-mode-toggle-sidebar"
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
            isDemoMode
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
              : 'bg-surface-700/60 border border-transparent text-slate-500 hover:text-slate-300',
          )}
        >
          <FlaskConical className="w-4 h-4 flex-shrink-0" />
          <span>{isDemoMode ? 'Demo Mode: On' : 'Demo Mode: Off'}</span>
          <div className={cn(
            'ml-auto w-8 h-4 rounded-full transition-colors relative',
            isDemoMode ? 'bg-amber-500' : 'bg-surface-600',
          )}>
            <span className={cn(
              'absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow transition-transform',
              isDemoMode ? 'translate-x-4.5' : 'translate-x-0.5',
            )} />
          </div>
        </button>
      </div>

      {/* User */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/40">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user.name.split(' ')[0]}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
