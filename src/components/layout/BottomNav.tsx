import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Map, Users, User } from 'lucide-react';
import { useAuth } from '@/features/auth';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  // Don't show bottom nav inside admin dashboard
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const items = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Report', path: '/report', icon: PlusCircle, isPrimary: true },
    { label: 'Map', path: '/map', icon: Map },
    { label: 'Community', path: '/community', icon: Users },
    { label: 'Profile', path: user ? '/profile' : '/auth', icon: User },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center -mt-5 relative group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-swach-600 to-swach-500 shadow-lg shadow-swach-500/30 flex items-center justify-center text-white border-2 border-slate-950 transition-transform active:scale-95 group-hover:scale-105">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-swach-400 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'text-swach-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
