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

  const fullName = profile?.full_name || 'Dutt Patel';
  const email = user?.email || 'dutt@example.com';

  const isOfficial = roles.includes('municipal_official');
  const isWorker = roles.includes('sanitation_worker');

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24 text-slate-900">
      {/* Profile Header Card (Matches Mockup Screen 10) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-4">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-800 font-extrabold text-2xl shadow-xs overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{fullName}</h2>
            {isOfficial && (
              <span className="p-1 rounded-full bg-teal-50 text-teal-700" title="Municipal Official">
                <ShieldCheck className="w-4 h-4" />
              </span>
            )}
            {isWorker && (
              <span className="p-1 rounded-full bg-amber-50 text-amber-700" title="Sanitation Worker">
                <HardHat className="w-4 h-4" />
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{email}</p>
        </div>

        {/* 3 Impact Stat Pills */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
          <Link
            to="/my-reports"
            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500/40 transition-colors"
          >
            <div className="text-lg font-extrabold text-slate-900">5</div>
            <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1 mt-0.5">
              <FileText className="w-3 h-3 text-emerald-600" />
              <span>Reports</span>
            </div>
          </Link>

          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-lg font-extrabold text-amber-600">120</div>
            <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1 mt-0.5">
              <Award className="w-3 h-3 text-amber-600" />
              <span>Points</span>
            </div>
          </div>

          <Link
            to="/community"
            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500/40 transition-colors"
          >
            <div className="text-lg font-extrabold text-slate-900">3</div>
            <div className="text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-teal-600" />
              <span>Events</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Role Navigation Portal Banners */}
      {isOfficial && (
        <Link
          to="/admin"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Open Municipal Operations Dashboard</span>
          </div>
          <ChevronRight className="w-4 h-4 text-teal-700" />
        </Link>
      )}

      {isWorker && (
        <Link
          to="/worker"
          className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <HardHat className="w-4 h-4 text-amber-700" />
            <span>Open Field Worker Task Board</span>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-700" />
        </Link>
      )}

      {/* Menu Options matching Screen 10 */}
      <div className="rounded-3xl bg-white border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
        {/* My Information */}
        <Link
          to="/my-reports"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-800"
        >
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-slate-500" />
            <span>My Information & Ward</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        {/* Language Selector */}
        <div className="flex items-center justify-between p-4 text-xs font-semibold text-slate-800">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-slate-500" />
            <span>Language / ભાષા</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                language === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('gu')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                language === 'gu' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ગુજરાતી
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-800 cursor-pointer">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-slate-500" />
            <span>Notification Settings</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Active
          </span>
        </div>

        {/* Saved Drafts */}
        <Link
          to="/report"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-800"
        >
          <div className="flex items-center gap-3">
            <Bookmark className="w-4 h-4 text-slate-500" />
            <span>Saved Drafts</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">1 draft</span>
        </Link>

        {/* Help & Support */}
        <Link
          to="/community"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-800"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Help & Municipal Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Logout Action */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out</span>
      </button>
    </div>
  );
}
