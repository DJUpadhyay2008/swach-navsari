import { useQuery } from '@tanstack/react-query';
import { getMunicipalStaffDirectory } from '@/features/admin';
import { ShieldCheck, HardHat, Phone, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminStaffPage() {
  const { data: staff = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-staff-directory'],
    queryFn: getMunicipalStaffDirectory,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Municipal Operations Staff Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered municipal officers and authorized sanitation crew leads across Navsari.
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
            Refresh Roster
          </Button>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            {staff.length} Authorized Staff
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 shadow-xs" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-slate-900">Failed to Load Staff Directory</p>
          <p className="text-xs text-slate-500">{(error as Error).message}</p>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : staff.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 shadow-xs text-center text-xs text-slate-500">
          No staff records currently found in <code>public.user_roles</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => {
            const isOfficial = s.role === 'municipal_official';

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-emerald-500/60 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isOfficial
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isOfficial ? <ShieldCheck className="w-5 h-5" /> : <HardHat className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{s.fullName}</h3>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 border ${
                          isOfficial
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isOfficial ? 'Municipal Official' : 'Sanitation Worker Lead'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  {s.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.wardNumber ? `Ward ${s.wardNumber}` : 'Navsari Headquarters'}</span>
                  </div>
                </div>

                {!isOfficial && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Active Task Load:</span>
                    <span className="font-bold text-slate-900">{s.activeWorkload} complaints</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
