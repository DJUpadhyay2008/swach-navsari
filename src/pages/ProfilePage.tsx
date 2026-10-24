import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import {
  User,
  Award,
  Calendar,
  FileText,
  Globe,
  Bell,
  Bookmark,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  HardHat,
} from 'lucide-react';

export function ProfilePage() {
  const { user, profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [language, setLanguage] = useState<'en' | 'gu'>('en');

  const isOfficial = roles.includes('municipal_official');
  const isWorker = roles.includes('sanitation_worker');

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Dutt Patel';
  const email = user?.email || 'dutt@example.com';

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header with Title */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-white tracking-tight">Citizen Profile</h1>
        <p className="text-xs text-slate-400 mt-0.5">Navsari Civic Cleanliness Account</p>
      </div>

      {/* User Identity Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3 shadow-xl relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-swach-500 to-gujarat-400 p-0.5 mx-auto shadow-lg shadow-swach-500/20">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-swach-400 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-lg font-bold text-white tracking-tight">{fullName}</h2>
            {isOfficial && (
              <span className="p-1 rounded-full bg-cyan-500/10 text-cyan-400" title="Municipal Official">
                <ShieldCheck className="w-4 h-4" />
              </span>
            )}
            {isWorker && (
              <span className="p-1 rounded-full bg-amber-500/10 text-amber-400" title="Sanitation Worker">
                <HardHat className="w-4 h-4" />
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{email}</p>
        </div>

        {/* 3 Impact Stat Pills */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80">
          <Link
            to="/my-reports"
            className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-swach-500/40 transition-colors"
          >
            <div className="text-lg font-extrabold text-white">5</div>
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <FileText className="w-3 h-3 text-swach-400" />
              <span>Reports</span>
            </div>
          </Link>

          <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="text-lg font-extrabold text-amber-400">120</div>
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Award className="w-3 h-3 text-amber-400" />
              <span>Points</span>
            </div>
          </div>

          <Link
            to="/community"
            className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-swach-500/40 transition-colors"
          >
            <div className="text-lg font-extrabold text-white">3</div>
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span>Events</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Role Navigation Portal Banners */}
      {isOfficial && (
        <Link
          to="/admin"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-800/50 text-cyan-300 hover:bg-cyan-950/50 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Open Municipal Operations Dashboard</span>
          </div>
          <ChevronRight className="w-4 h-4 text-cyan-400" />
        </Link>
      )}

      {isWorker && (
        <Link
          to="/worker"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/50 text-amber-300 hover:bg-amber-950/50 transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <HardHat className="w-4 h-4 text-amber-400" />
            <span>Open Field Worker Task Board</span>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </Link>
      )}

      {/* Menu Options matching Screen 10 */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-lg">
        {/* My Information */}
        <Link
          to="/my-reports"
          className="flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors text-xs font-medium text-slate-200"
        >
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-slate-400" />
            <span>My Information & Ward</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </Link>

        {/* Language Selector */}
        <div className="flex items-center justify-between p-4 text-xs font-medium text-slate-200">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-slate-400" />
            <span>Language / ભાષા</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                language === 'en' ? 'bg-swach-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('gu')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                language === 'gu' ? 'bg-swach-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ગુજરાતી
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors text-xs font-medium text-slate-200 cursor-pointer">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-slate-400" />
            <span>Notification Settings</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Active
          </span>
        </div>

        {/* Saved Drafts */}
        <Link
          to="/report"
          className="flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors text-xs font-medium text-slate-200"
        >
          <div className="flex items-center gap-3">
            <Bookmark className="w-4 h-4 text-slate-400" />
            <span>Saved Drafts</span>
          </div>
          <span className="text-[10px] text-slate-500">1 draft</span>
        </Link>

        {/* Help & Support */}
        <Link
          to="/community"
          className="flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors text-xs font-medium text-slate-200"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Help & Municipal Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </Link>
      </div>

      {/* Logout Action */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out</span>
      </button>
    </div>
  );
}
