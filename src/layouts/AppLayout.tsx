import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { BottomNav } from '../components/navigation/BottomNav';
import { Header } from '../components/navigation/Header';

// ─── App Layout ───────────────────────────────────────────────────────────────

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen">
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
