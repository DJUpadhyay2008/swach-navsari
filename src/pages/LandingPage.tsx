import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NAVSARI_WARDS } from '@/lib/utils';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Sparkles,
  ClipboardList,
  MapPin,
  Users,
  Award,
  PlusCircle,
  ChevronRight,
} from 'lucide-react';

interface LiveReportItem {
  id: string;
  complaint_id?: string | null;
  category?: string | null;
  address_locality?: string | null;
  status?: string | null;
  created_at: string;
  photo_urls?: string[] | null;
}

interface NearbyIssue {
  id: string;
  complaint_id: string;
  category: string;
  location: string;
  timeAgo: string;
  status: 'submitted' | 'in_progress' | 'resolved';
  imageUrl: string;
}

const DEFAULT_NEARBY_ISSUES: NearbyIssue[] = [
  {
    id: '1',
    complaint_id: 'NMC202610120457',
    category: 'Overflowing Bin',
    location: 'Station Road',
    timeAgo: '2 hours ago',
    status: 'in_progress',
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '2',
    complaint_id: 'NMC202610110321',
    category: 'Garbage Dumping',
    location: 'GIDC Area',
    timeAgo: '5 hours ago',
    status: 'submitted',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '3',
    complaint_id: 'NMC202610080137',
    category: 'Street Litter',
    location: 'College Road',
    timeAgo: '8 hours ago',
    status: 'submitted',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: '4',
    complaint_id: 'NMC202610050772',
    category: 'Drainage-related Waste',
    location: 'Lunsikui Area',
    timeAgo: 'Yesterday',
    status: 'resolved',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80',
  },
];

export function LandingPage() {
  const [issues, setIssues] = useState<NearbyIssue[]>(DEFAULT_NEARBY_ISSUES);
  const [reportCount, setReportCount] = useState<number>(5);

  useEffect(() => {
    async function loadLiveData() {
      if (!isSupabaseConfigured()) return;
      const supabase = getSupabase();
      if (!supabase) return;

      try {
        const { data, count } = await supabase
          .from('reports')
          .select('id, complaint_id, category, address_locality, status, created_at, photo_urls', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(4);

        if (count !== null && count > 0) {
          setReportCount(count);
        }

        if (data && data.length > 0) {
          const mapped: NearbyIssue[] = (data as unknown as LiveReportItem[]).map((d, i: number) => {
            let statusBadge: 'submitted' | 'in_progress' | 'resolved' = 'submitted';
            if (d.status === 'in_progress' || d.status === 'assigned') statusBadge = 'in_progress';
            if (d.status === 'resolved' || d.status === 'closed') statusBadge = 'resolved';

            return {
              id: d.id,
              complaint_id: d.complaint_id || `NMC202610120${i}`,
              category: d.category ? String(d.category).replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Civic Waste',
              location: d.address_locality || 'Navsari Central',
              timeAgo: new Date(d.created_at).toLocaleDateString(),
              status: statusBadge,
              imageUrl:
                d.photo_urls && d.photo_urls.length > 0 && d.photo_urls[0]
                  ? d.photo_urls[0]
                  : DEFAULT_NEARBY_ISSUES[i % DEFAULT_NEARBY_ISSUES.length]?.imageUrl ||
                    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80',
            };
          });
          setIssues(mapped);
        }
      } catch {
        // Fallback gracefully to default items
      }
    }

    loadLiveData();
  }, []);

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-24 sm:pb-12 text-slate-900">
      {/* 1. Hero / Welcome Card (Matches Mockup Screen 1) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-10 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Together for a Cleaner Greener Navsari</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Welcome!</h1>
            <p className="text-base sm:text-lg text-emerald-100 font-medium">
              Join thousands of citizens keeping our city clean and beautiful
            </p>
          </div>

          <div className="pt-2">
            <Link to="/report">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white hover:bg-slate-100 text-emerald-800 font-bold px-8 py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-base border-none"
              >
                <PlusCircle className="w-5 h-5 text-emerald-700" />
                <span>Report an Issue</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. 2x2 Quick Action / Stats Grid (Matches Mockup Screen 1) */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: My Reports */}
          <Link
            to="/my-reports"
            className="group p-4 sm:p-5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-emerald-500/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform mb-3">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                My Reports
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{reportCount} Active</div>
            </div>
          </Link>

          {/* Card 2: Nearby Issues */}
          <Link
            to="/map"
            className="group p-4 sm:p-5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-teal-500/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 group-hover:scale-105 transition-transform mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                Nearby Issues
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">12 in 2 km</div>
            </div>
          </Link>

          {/* Card 3: Community */}
          <Link
            to="/community"
            className="group p-4 sm:p-5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-cyan-500/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform mb-3">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                Community
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">3 Events</div>
            </div>
          </Link>

          {/* Card 4: My Impact */}
          <Link
            to="/profile"
            className="group p-4 sm:p-5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-amber-500/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform mb-3">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                My Impact
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">120 Points</div>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Nearby Issues Section (Matches Mockup Screen 1) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Nearby Issues</h2>
            <p className="text-xs text-slate-500">Recent civic sanitation reports in your ward area</p>
          </div>
          <Link
            to="/map"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {issues.map((item) => (
            <Link
              key={item.id}
              to={`/reports/${item.id}`}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500/50 transition-all shadow-xs hover:shadow-md group"
            >
              <img
                src={item.imageUrl}
                alt={item.category}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                    {item.category}
                  </h3>
                  {item.status === 'in_progress' ? (
                    <Badge variant="warning" size="sm">
                      In Progress
                    </Badge>
                  ) : item.status === 'resolved' ? (
                    <Badge variant="success" size="sm">
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="info" size="sm">
                      Submitted
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{item.location}</span>
                  <span className="text-slate-300">•</span>
                  <span>{item.timeAgo}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Municipal Operations & Wards Snapshot */}
      <section className="pt-4 border-t border-slate-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Navsari Municipal Service Wards</h3>
            <p className="text-xs text-slate-500">13 Active Wards covered by Swachh Navsari Teams</p>
          </div>
          <Link to="/map">
            <span className="text-xs font-bold text-emerald-700 hover:underline">Explore Ward Map &rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {NAVSARI_WARDS.slice(0, 4).map((ward) => (
            <div
              key={ward.number}
              className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs text-xs space-y-1"
            >
              <div className="font-bold text-emerald-700">Ward #{ward.number}</div>
              <div className="text-slate-800 font-semibold truncate">{ward.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{ward.keyLandmarks[0]}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
