import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Navigation, BookOpen,
  MessageCircle, AlertOctagon
} from 'lucide-react';
import { cn } from '../../utils/formatters';

// ─── Bottom Navigation (mobile) ───────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/',          label: 'Home',      icon: LayoutDashboard },
  { to: '/journey',   label: 'Journey',   icon: Navigation      },
  { to: '/emergency', label: 'SOS',       icon: AlertOctagon    },
  { to: '/companion', label: 'Saheli',    icon: MessageCircle   },
  { to: '/learn',     label: 'Learn',     icon: BookOpen        },
];

export function BottomNav() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-pink-200/80 shadow-[0_-4px_24px_rgba(232,93,117,0.08)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isSOS = label === 'SOS';
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              id={`bottom-nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[52px]',
                  isSOS && 'relative -mt-5',
                  isActive && !isSOS && 'text-primary-600 font-bold',
                  !isActive && !isSOS && 'text-slate-500 hover:text-primary-600',
                )
              }
            >
              {isSOS ? (
                <div className="w-13 h-13 rounded-full flex items-center justify-center shadow-glow-danger bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 transition-all duration-200 border-2 border-white p-3">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="w-7 h-7 flex items-center justify-center rounded-xl">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <span className={cn('text-[10px] font-semibold leading-none', isSOS && 'text-rose-600 font-bold')}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
