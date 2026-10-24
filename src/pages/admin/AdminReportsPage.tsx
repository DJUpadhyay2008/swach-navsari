import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAdminReports } from '@/features/admin';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { SlaBadge } from '@/features/admin/components/SlaBadge';
import { NAVSARI_WARDS, CATEGORY_LABELS, formatDate } from '@/lib/utils';
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES } from '@/lib/validation/reports';
import type { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@/types/database.types';
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Inbox,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read params
  const statusParam = (searchParams.get('status') as ComplaintStatus | 'all') || 'all';
  const categoryParam = (searchParams.get('category') as ComplaintCategory | 'all') || 'all';
  const priorityParam = (searchParams.get('priority') as ComplaintPriority | 'all') || 'all';
  const wardParam = searchParams.get('ward') ? Number(searchParams.get('ward')) : 'all';
  const searchQuery = searchParams.get('q') || '';
  const sortBy = (searchParams.get('sortBy') as 'submitted_at_desc' | 'submitted_at_asc' | 'priority_desc' | 'status') || 'submitted_at_desc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 12;

  const [searchInput, setSearchInput] = useState(searchQuery);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set('page', '1'); // reset page on filter change
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput.trim() ? searchInput.trim() : null);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters =
    statusParam !== 'all' ||
    categoryParam !== 'all' ||
    priorityParam !== 'all' ||
    wardParam !== 'all' ||
    Boolean(searchQuery);

  // TanStack Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'admin-reports',
      { status: statusParam, category: categoryParam, priority: priorityParam, ward: wardParam, searchQuery, sortBy, page },
    ],
    queryFn: () =>
      getAdminReports({
        status: statusParam,
        category: categoryParam,
        priority: priorityParam,
        ward: wardParam,
        searchQuery,
        sortBy,
        page,
        pageSize,
      }),
  });

  const reports = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Complaint Operations Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Triage, assignment, and status management for Navsari municipal cleanliness reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={resetFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Filters
            </Button>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            {totalCount} Total Reports
          </span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Complaint Reference (e.g. NAV-2026-00101) or Locality / Street..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
          <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
            Search
          </Button>
        </form>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Status</label>
            <select
              value={statusParam}
              onChange={(e) => updateParam('status', e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted (New)</option>
              <option value="under_review">Under Review</option>
              <option value="assigned">Worker Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolution_submitted">Awaiting Verification</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
              <option value="reopened">Reopened</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Priority</label>
            <select
              value={priorityParam}
              onChange={(e) => updateParam('priority', e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Priorities</option>
              {COMPLAINT_PRIORITIES.map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Category</label>
            <select
              value={categoryParam}
              onChange={(e) => updateParam('category', e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]?.label || c}
                </option>
              ))}
            </select>
          </div>

          {/* Ward */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Ward Area</label>
            <select
              value={wardParam.toString()}
              onChange={(e) => updateParam('ward', e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All 13 Wards</option>
              {NAVSARI_WARDS.map((w) => (
                <option key={w.number} value={w.number.toString()}>
                  Ward {w.number} - {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => updateParam('sortBy', e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="submitted_at_desc">Newest First</option>
              <option value="submitted_at_asc">Oldest First</option>
              <option value="priority_desc">Highest Priority (SLA)</option>
              <option value="status">Lifecycle Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-900">Failed to Load Complaint Records</p>
            <p className="text-xs text-slate-500">{(error as Error).message}</p>
            <Button size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">No Complaints Match Your Criteria</p>
            <p className="text-xs text-slate-500">
              Try adjusting your filter options or search query to find matching municipal reports.
            </p>
            {hasActiveFilters && (
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Clear Active Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Ward / Locality</th>
                  <th className="py-3 px-4">Priority / SLA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Worker</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => {
                  const cat = CATEGORY_LABELS[rep.category];
                  const isResolved = rep.status === 'resolved' || rep.status === 'rejected' || rep.status === 'cancelled';

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                      {/* Reference */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        <Link to={`/admin/reports/${rep.id}`} className="hover:underline">
                          {rep.complaint_id}
                        </Link>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{cat?.label || rep.category}</div>
                        <div className="text-[10px] text-slate-500">{cat?.gujarati}</div>
                      </td>

                      {/* Ward & Locality */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {rep.ward_number ? `Ward ${rep.ward_number}` : 'Navsari'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {rep.address_locality || 'Civic location'}
                          {rep.landmark ? ` • ${rep.landmark}` : ''}
                        </div>
                      </td>

                      {/* Priority / SLA */}
                      <td className="py-3.5 px-4">
                        <SlaBadge priority={rep.priority} isOverdue={rep.isOverdue} isResolved={isResolved} />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={rep.status} />
                      </td>

                      {/* Assigned Worker */}
                      <td className="py-3.5 px-4">
                        {rep.activeAssignment ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-800">
                            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                            <span className="font-medium">{rep.activeAssignment.workerName}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Submitted */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {formatDate(rep.submitted_at)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/admin/reports/${rep.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 border-slate-200 hover:bg-slate-50">
                            Triage &rarr;
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <div>
              Showing <span className="font-bold text-slate-800">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(page * pageSize, totalCount)}</span> of{' '}
              <span className="font-bold text-slate-800">{totalCount}</span> complaints
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', (page - 1).toString());
                  setSearchParams(next);
                }}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <span className="font-medium px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', (page + 1).toString());
                  setSearchParams(next);
                }}
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
