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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-800/95 backdrop-blur-md border-t border-white/10"
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
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]',
                  isSOS && 'relative -mt-4',
                  isActive && !isSOS && 'text-primary-400',
                  !isActive && !isSOS && 'text-slate-500 hover:text-slate-300',
                )
              }
            >
              {isSOS ? (
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-glow-danger bg-danger-600 hover:bg-danger-500 transition-all duration-200">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="w-7 h-7 flex items-center justify-center rounded-lg">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <span className={cn('text-[10px] font-medium leading-none', isSOS && 'text-danger-400')}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
