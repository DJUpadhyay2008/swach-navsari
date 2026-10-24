import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminAuditTrail } from '@/features/admin';
import { formatDate } from '@/lib/utils';
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 20;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-audit-trail', page],
    queryFn: () => getAdminAuditTrail(page, pageSize),
  });

  const auditRows = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const filteredRows = searchQuery.trim()
    ? auditRows.filter(
        (r) =>
          r.complaintId?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          r.newStatus?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          r.actorName?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : auditRows;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Statutory Log
            </span>
            <span className="text-xs text-[#64748B]">Read-Only Immutable Store</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172B3A] tracking-tight mt-1">
            Civic Operations Audit Trail
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Immutable chronological record of complaint status changes, official reviews, rejections, and worker assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            isLoading={isFetching}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Log
          </Button>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-[#087F7B] border border-teal-200">
            {totalCount} Total Audit Entries
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by Complaint Ref, Status, or Actor Name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-[#172B3A] focus:outline-none focus:ring-1 focus:ring-[#087F7B]"
          />
        </div>

        <div className="text-[11px] text-[#64748B] hidden sm:block">
          Logged via PostgreSQL Trigger & Functions
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-[#172B3A]">Failed to Load Audit Trail</p>
            <p className="text-xs text-[#64748B]">{(error as Error).message}</p>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B] space-y-2">
            <History className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="font-semibold text-[#172B3A]">No Audit Entries Found</p>
            <p>No status transitions have been recorded matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172B3A]">
              <thead className="bg-slate-50 text-[#64748B] uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Complaint Ref</th>
                  <th className="py-3 px-4">Lifecycle Action</th>
                  <th className="py-3 px-4">Responsible Actor</th>
                  <th className="py-3 px-4">Audit Note / Reason</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#087F7B]">
                      {row.complaintId ? (
                        <Link to={`/admin/reports/${row.reportId}`} className="hover:underline">
                          {row.complaintId}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#172B3A]">
                      {row.previousStatus ? (
                        <span>
                          <span className="text-slate-400 font-normal">{row.previousStatus}</span> &rarr;{' '}
                          <span className="text-[#087F7B]">{row.newStatus}</span>
                        </span>
                      ) : (
                        <span className="text-teal-700">Initial Registration: {row.newStatus}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#172B3A]">
                      <span className="font-medium">{row.actorName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 italic max-w-xs truncate">
                      {row.note ? `"${row.note}"` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {row.reportId && (
                        <Link to={`/admin/reports/${row.reportId}`}>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-[#087F7B]">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
            <div>
              Page <span className="font-bold text-[#172B3A]">{page}</span> of{' '}
              <span className="font-bold text-[#172B3A]">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
