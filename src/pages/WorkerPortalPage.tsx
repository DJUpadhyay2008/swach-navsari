import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import {
  HardHat,
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  Navigation,
  Lock,
} from 'lucide-react';

export function WorkerPortalPage() {
  const backendConfigured = isSupabaseConfigured();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="warning">Worker Portal</Badge>
          <Badge variant="neutral">Role: sanitation_worker</Badge>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Field Sanitation Task Board
        </h1>
        <p className="text-sm text-slate-400">
          Mobile-responsive task queue for Navsari sanitation workers and rapid response units.
        </p>
      </div>

      {!backendConfigured ? (
        <Alert variant="warning" title="Worker Session Notice">
          <p>
            In production, tasks displayed on this page are strictly scoped by the database RLS policy{' '}
            <code className="text-amber-300 font-mono">reports_select_policy</code> where{' '}
            <code className="text-amber-300 font-mono">public.is_assigned_worker(reports.id, auth.uid())</code>{' '}
            is true. Workers cannot access unrelated private reports or citizen records.
          </p>
        </Alert>
      ) : (
        <Alert variant="success" title="Worker Scope Secured">
          Connected to database. Task queue is isolated to tasks assigned to your worker ID.
        </Alert>
      )}

      {/* Active Assignment Task Card (Demo Representation from Seed Data) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <HardHat className="w-5 h-5 text-amber-400" />
          <span>Active Assigned Tasks (1)</span>
        </h2>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-white">NAV-2026-00101</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold">
                  In Progress
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gujarat-400" />
                <span>Ward 7 — Dudhia Talav Garden Perimeter</span>
              </div>
            </div>

            <div className="text-xs text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>SLA Target: 24h Remaining</span>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-white">Task Instruction from Official:</div>
              <p className="text-slate-400">
                &ldquo;Dispatched Ward 7 mini-dumper and 4 personnel for clearing plastic packaging and
                commercial solid waste near East Gate Children Play Area.&rdquo;
              </p>
            </div>

            {/* Resolution Upload Requirement */}
            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-center space-y-2">
              <Camera className="w-6 h-6 mx-auto text-swach-400" />
              <div className="text-xs font-semibold text-slate-200">
                Upload Post-Cleanup Resolution Photo
              </div>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Evidence photos are automatically stored in the private{' '}
                <code className="text-slate-300">resolution-evidence</code> bucket and verified by
                the municipal supervisor before final closure.
              </p>
              <div className="pt-1">
                <Button size="sm" variant="outline" leftIcon={<Camera className="w-4 h-4" />}>
                  Select Completion Photo
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <Button size="sm" variant="ghost" leftIcon={<Navigation className="w-3.5 h-3.5" />}>
                Open GPS Navigation
              </Button>
              <Button size="sm" variant="primary" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                Submit Resolution for Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Architecture note */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Lock className="w-4 h-4 text-swach-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Worker Authorization Boundary:</span>{' '}
          Sanitation workers cannot assign complaints to other workers or dismiss reports without
          submitting photographic evidence in <code className="text-swach-300">resolution_evidence</code>.
        </div>
      </div>
    </div>
  );
}
