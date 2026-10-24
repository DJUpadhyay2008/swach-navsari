import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base">S.W.A.C.H. Navsari</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-gujarat-500/20 text-gujarat-400 border border-gujarat-500/30">
                Gujarat
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Systematic Waste Action & Cleanliness Hub. Enabling citizens, municipal officials,
              and sanitation workers to keep Navsari clean, healthy, and vibrant.
            </p>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 text-swach-400 shrink-0" />
              <span>Navsari Municipality, Gujarat, India</span>
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Civic Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/report" className="hover:text-swach-400 transition-colors">
                  Report Civic Waste
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-swach-400 transition-colors">
                  Track Complaint by ID
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-swach-400 transition-colors">
                  Community Cleanliness Drives
                </Link>
              </li>
              <li>
                <span className="text-slate-400">Emergency Helpline: 1800-NAVSARI</span>
              </li>
            </ul>
          </div>

          {/* Key Civic Zones */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Navsari Key Sectors
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Active coverage across 13 civic wards including Dudhia Talav, Lunsikui Market,
              Dandi Heritage Corridor, Station Road, Junathana, and Kaliawadi.
            </p>
          </div>

          {/* Security & Architecture */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Security & Privacy
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Protected by PostgreSQL Row Level Security (RLS) & private Supabase object storage.
              Protected role management prevents privilege escalation.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} S.W.A.C.H. Navsari. Report. Resolve. Revive.
          </div>
          <div className="flex items-center gap-1">
            <span>Built for the citizens of Navsari with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
