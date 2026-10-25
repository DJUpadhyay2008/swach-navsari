import { useQuery } from '@tanstack/react-query';
import { getGeospatialReports } from '@/features/admin';
import { NavsariInteractiveMap } from '@/features/admin/components/NavsariInteractiveMap';
import { useDemoMode, DemoDataBanner, DemoToggle, SIMULATED_REPORTS } from '@/lib/demo';
import { MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminMapPage() {
  const { isDemoMode } = useDemoMode();

  const { data: liveReports = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-geospatial-reports'],
    queryFn: getGeospatialReports,
    enabled: !isDemoMode,
  });

  const displayedReports = isDemoMode ? SIMULATED_REPORTS : liveReports;

  return (
    <div className="space-y-6">
      <DemoDataBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#172B3A] tracking-tight">
              Geographic Distribution & Ward Heatmap
            </h1>
            {isDemoMode && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                SIMULATED DATA
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isDemoMode
              ? 'Displaying synthetic geospatial plotting across Navsari’s 13 municipal wards for hackathon demonstration.'
              : 'Real-time geospatial plotting of citizen complaints across Navsari’s 13 municipal wards.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DemoToggle />

          {!isDemoMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              isLoading={isFetching}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Telemetry
            </Button>
          )}
        </div>
      </div>

      {!isDemoMode && isLoading ? (
        <div className="h-96 bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center animate-pulse">
          <div className="text-center space-y-2">
            <MapPin className="w-8 h-8 text-[#087F7B] mx-auto animate-bounce" />
            <p className="text-xs text-slate-500 font-semibold">Loading Navsari GIS Telemetry...</p>
          </div>
        </div>
      ) : !isDemoMode && error ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-[#172B3A]">Failed to Load Geospatial Data</p>
          <p className="text-xs text-[#64748B]">{(error as Error).message}</p>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <NavsariInteractiveMap reports={displayedReports} />
      )}
    </div>
  );
}
