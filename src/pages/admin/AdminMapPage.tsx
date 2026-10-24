import { useQuery } from '@tanstack/react-query';
import { getGeospatialReports } from '@/features/admin';
import { NavsariInteractiveMap } from '@/features/admin/components/NavsariInteractiveMap';
import { MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminMapPage() {
  const { data: reports = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-geospatial-reports'],
    queryFn: getGeospatialReports,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#172B3A] tracking-tight">
            Geographic Distribution & Ward Heatmap
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time geospatial plotting of citizen complaints across Navsari's 13 municipal wards.
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
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center animate-pulse">
          <div className="text-center space-y-2">
            <MapPin className="w-8 h-8 text-[#087F7B] mx-auto animate-bounce" />
            <p className="text-xs text-slate-500 font-semibold">Loading Navsari GIS Telemetry...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-[#172B3A]">Failed to Load Geospatial Data</p>
          <p className="text-xs text-[#64748B]">{(error as Error).message}</p>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <NavsariInteractiveMap reports={reports} />
      )}
    </div>
  );
}
