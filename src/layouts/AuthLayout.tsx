
import { Outlet } from 'react-router-dom';
import { ShieldHalf } from 'lucide-react';

// ─── Auth Layout ──────────────────────────────────────────────────────────────

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center px-4">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary">
            <ShieldHalf className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Saheli AI</h1>
            <p className="text-slate-400 text-sm">Your Predictive Safety Companion</p>
          </div>
        </div>

        {/* Form card */}
        <div className="glass-card p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
