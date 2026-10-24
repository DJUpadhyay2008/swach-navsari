import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  UserCheck,
  Clock,
  CheckCircle2,
  Lock,
  Database,
} from 'lucide-react';

export function MunicipalAdminPage() {
  const backendConfigured = isSupabaseConfigured();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="warning">Restricted Access</Badge>
            <Badge variant="neutral">Role: municipal_official</Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Municipal Sanitation Administration
          </h1>
          <p className="text-sm text-slate-400">
            Navsari Municipality triage, ward-level assignment, SLA monitoring, and verification dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<Database className="w-4 h-4" />}>
            Export Civic Audit Trail
          </Button>
        </div>
      </div>

      {/* Backend connection warning */}
      {!backendConfigured ? (
        <Alert variant="warning" title="Database Disconnected — Architecture Shell Mode">
          <p>
            The administrative console requires an authenticated session with the{' '}
            <code className="text-amber-300 font-mono">municipal_official</code> role.
            Row Level Security (RLS) policies defined in{' '}
            <code className="text-amber-300 font-mono">supabase/migrations/20260224000003_rls_policies.sql</code>{' '}
            block unauthenticated or unauthorized users from reading or mutating triage assignments.
          </p>
        </Alert>
      ) : (
        <Alert variant="info" title="RLS Authorization Policy Active">
          Only users assigned to <code>municipal_official</code> in the protected{' '}
          <code>public.user_roles</code> table can view administrative complaints.
        </Alert>
      )}

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Pending Triage</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">4</div>
          <div className="text-[11px] text-amber-400 mt-1">Requires official review</div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Active Dispatched</span>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">7</div>
          <div className="text-[11px] text-blue-400 mt-1">Sanitation units on-site</div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Awaiting Verification</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">2</div>
          <div className="text-[11px] text-teal-400 mt-1">Resolution evidence uploaded</div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Resolved (This Month)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">43</div>
          <div className="text-[11px] text-emerald-400 mt-1">94.8% SLA compliance</div>
        </Card>
      </div>

      {/* Triage Table Shell */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Incoming Complaints Queue</CardTitle>
              <CardDescription>
                Live queue filtered through RLS policy <code>reports_select_policy</code>.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter by Ward:</span>
              <select className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200">
                <option value="all">All Wards (1-13)</option>
                <option value="4">Ward 4 (Lunsikui)</option>
                <option value="7">Ward 7 (Dudhia Talav)</option>
                <option value="2">Ward 2 (Dandi Road)</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Ward / Locality</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">NAV-2026-00102</td>
                  <td className="py-3.5 px-4">Overflowing Community Bin</td>
                  <td className="py-3.5 px-4">Ward 4 — Lunsikui Vegetable Market</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      URGENT (24h)
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Submitted
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Button size="sm" variant="outline">
                      Assign Worker
                    </Button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">NAV-2026-00101</td>
                  <td className="py-3.5 px-4">Open Garbage Dump</td>
                  <td className="py-3.5 px-4">Ward 7 — Dudhia Talav Promenade</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      HIGH (48h)
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      In Progress
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Button size="sm" variant="ghost">
                      View Dispatch
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Security Architecture Box */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Lock className="w-4 h-4 text-swach-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">
            Administrative Protection Principle:
          </span>{' '}
          Municipal officials can trigger state transitions via the trusted PostgreSQL function{' '}
          <code className="text-swach-300">public.transition_report_status()</code>. Rejections
          strictly require a documented reason (minimum 5 characters).
        </div>
      </div>
    </div>
  );
}
