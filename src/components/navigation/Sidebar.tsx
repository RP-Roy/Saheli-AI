import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Navigation, BookOpen, MessageCircle,
  AlertOctagon, Settings, Shield
} from 'lucide-react';
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
  const { user } = useApp();

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white/90 backdrop-blur-xl border-r border-pink-200/70 fixed left-0 top-0 bottom-0 z-30 shadow-[4px_0_24px_rgba(232,93,117,0.03)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-pink-100/70">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-rose-400 flex items-center justify-center flex-shrink-0 shadow-soft-pink">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-base font-extrabold text-slate-900 leading-none tracking-tight">Saheli AI</p>
          <p className="text-[11px] font-semibold text-primary-600 mt-1">Safety Companion</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3.5 py-5 space-y-1.5" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end, danger }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            id={`nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200',
                isActive
                  ? danger
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm'
                    : 'bg-primary-50 text-primary-700 border border-primary-200/80 shadow-sm'
                  : danger
                  ? 'text-rose-600/80 hover:text-rose-700 hover:bg-rose-50/60'
                  : 'text-slate-600 hover:text-primary-700 hover:bg-pink-50/60',
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Card */}
      <div className="px-4 pb-5 border-t border-pink-100/70 pt-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-blush-100/80 border border-pink-200/50 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-rose-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
