import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { BottomNav } from '../components/navigation/BottomNav';
import { Header } from '../components/navigation/Header';

// ─── App Layout ───────────────────────────────────────────────────────────────

export function AppLayout() {
  return (
    <div className="min-h-screen bg-blush-200 text-slate-800 flex relative selection:bg-primary-100 selection:text-primary-800">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen relative z-10">
        <Header />

        {/* Page content */}
        <main
          className="flex-1 pb-24 lg:pb-8 overflow-x-hidden"
          id="main-content"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
