import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ConfigBanner } from './ConfigBanner';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <ConfigBanner />
      <Header />
      <main className="flex-1 flex flex-col pb-16 sm:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
