import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NAVSARI_WARDS } from '@/lib/utils';
import {
  Sparkles,
  ClipboardList,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  HardHat,
  Users,
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="flex-1 space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800/80 p-8 sm:p-12 lg:p-16 shadow-2xl">
          {/* Subtle glow backdrop */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-swach-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gujarat-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-swach-500/10 border border-swach-500/20 text-swach-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-swach-400" />
              <span>Civic Cleanliness Platform for Navsari</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Report. Resolve.{' '}
              <span className="bg-gradient-to-r from-swach-400 via-swach-300 to-gujarat-400 bg-clip-text text-transparent">
                Revive.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              S.W.A.C.H. Navsari connects citizens directly with municipal sanitation teams to identify,
              triage, and clear civic waste across all 13 wards of Navsari, Gujarat.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/report">
                <Button size="lg" leftIcon={<ClipboardList className="w-5 h-5" />}>
                  Report Waste Incident
                </Button>
              </Link>
              <Link to="/track">
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<Search className="w-5 h-5" />}
                >
                  Track Complaint
                </Button>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80">
              <div>
                <div className="text-2xl font-bold text-white">13 Wards</div>
                <div className="text-xs text-slate-400">Navsari Municipal Area</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-swach-400">&lt; 24h</div>
                <div className="text-xs text-slate-400">Urgent SLA Target</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-slate-400">Photo Proof Verified</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gujarat-400">RLS-Backed</div>
                <div className="text-xs text-slate-400">Security Architecture</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="neutral">Platform Architecture</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            End-to-End Systematic Cleanliness Pipeline
          </h2>
          <p className="text-sm text-slate-400">
            A transparent workflow from initial citizen geotagged submission to on-site municipal verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <Card className="glass-card-hover relative flex flex-col justify-between">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-swach-500/10 border border-swach-500/30 flex items-center justify-center text-swach-400">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-white">1. Citizen Reporting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Capture photo evidence with GPS coordinates, select category and ward, and submit.
                Safe, non-enumerable tracking ID generated immediately.
              </p>
            </CardContent>
            <div className="pt-4 border-t border-slate-800/60 flex items-center text-xs text-swach-400 font-medium">
              <span>Submit in &lt; 60 seconds</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="glass-card-hover relative flex flex-col justify-between">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-white">2. Municipal Triage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Officials review reports on the administrative dashboard, evaluate priority, and assign to
                the designated ward sanitation worker unit.
              </p>
            </CardContent>
            <div className="pt-4 border-t border-slate-800/60 flex items-center text-xs text-blue-400 font-medium">
              <span>Ward-level routing</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="glass-card-hover relative flex flex-col justify-between">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-white">3. Worker Resolution</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sanitation workers receive mobile assignments, arrive at site, clear the waste, and upload
                timestamped completion evidence.
              </p>
            </CardContent>
            <div className="pt-4 border-t border-slate-800/60 flex items-center text-xs text-amber-400 font-medium">
              <span>Proof-of-work validation</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>

          {/* Step 4 */}
          <Card className="glass-card-hover relative flex flex-col justify-between">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-white">4. Verification & Revive</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Citizens verify the resolution or dispute it within 72 hours. Join community drives
                to revitalize Navsari&apos;s lakes and green spaces.
              </p>
            </CardContent>
            <div className="pt-4 border-t border-slate-800/60 flex items-center text-xs text-emerald-400 font-medium">
              <span>Citizen feedback loop</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Card>
        </div>
      </section>

      {/* Navsari Wards Directory Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Navsari Municipal Wards</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Sanitation monitoring active across all civic subdivisions
            </p>
          </div>
          <Badge variant="success">All 13 Wards Active</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAVSARI_WARDS.slice(0, 6).map((ward) => (
            <Card key={ward.number} className="p-4 bg-slate-900/40 border border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold text-swach-400">Ward #{ward.number}</div>
                  <h4 className="text-sm font-semibold text-white mt-0.5">{ward.name}</h4>
                </div>
                <Badge size="sm" variant="neutral">Active</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ward.keyLandmarks.map((landmark) => (
                  <span
                    key={landmark}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50"
                  >
                    {landmark}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Security Architecture Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-swach-500/10 border border-swach-500/30 flex items-center justify-center text-swach-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">
                Phase 1 Database Architecture &amp; RLS Protection
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                This foundation enforces strict PostgreSQL Row Level Security (RLS) across all 10 domain entities.
                User roles are managed in a protected database table to prevent client-side privilege escalation.
                All photo evidence is stored in private Supabase Storage buckets, guarded by granular storage policies.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-swach-400" />
                  Protected Roles Structure
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-swach-400" />
                  Private Supabase Storage
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-swach-400" />
                  Safe Non-Enumerable Complaint IDs
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-swach-400" />
                  Database State Machine Enforcement
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
