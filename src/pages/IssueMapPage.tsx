import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase/client';
import { Search, MapPin, Navigation, Eye, Sparkles } from 'lucide-react';
import { STATUS_CONFIG, CATEGORY_LABELS } from '@/lib/utils';
import type { ComplaintStatus, ComplaintCategory } from '@/types/database.types';

interface MapReportItem {
  id: string;
  complaint_id: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: string;
  address_locality: string;
  latitude: number;
  longitude: number;
  submitted_at: string;
}

const MOCK_MAP_REPORTS: MapReportItem[] = [
  {
    id: 'rep-1',
    complaint_id: 'NAV-2026-00001',
    category: 'garbage_dump',
    status: 'in_progress',
    priority: 'medium',
    address_locality: 'ShreenathDham, Ward 4',
    latitude: 20.9467,
    longitude: 72.9281,
    submitted_at: '2026-10-24T10:00:00Z',
  },
  {
    id: 'rep-2',
    complaint_id: 'NAV-2026-00101',
    category: 'overflowing_bin',
    status: 'assigned',
    priority: 'high',
    address_locality: 'Dudhia Talav Lakeside Promenade, Ward 7',
    latitude: 20.9525,
    longitude: 72.9325,
    submitted_at: '2026-10-24T08:30:00Z',
  },
  {
    id: 'rep-3',
    complaint_id: 'NAV-2026-00098',
    category: 'sewage_overflow',
    status: 'resolved',
    priority: 'urgent',
    address_locality: 'Dandi Heritage Corridor, Ward 2',
    latitude: 20.938,
    longitude: 72.915,
    submitted_at: '2026-10-23T14:15:00Z',
  },
  {
    id: 'rep-4',
    complaint_id: 'NAV-2026-00105',
    category: 'drainage_blockage',
    status: 'submitted',
    priority: 'medium',
    address_locality: 'Station Road Clock Tower, Ward 5',
    latitude: 20.954,
    longitude: 72.923,
    submitted_at: '2026-10-24T12:00:00Z',
  },
];

export function IssueMapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<MapReportItem>(MOCK_MAP_REPORTS[0]!);

  const { data: liveReports } = useQuery({
    queryKey: ['public-map-reports'],
    queryFn: async () => {
      const supabase = getSupabase();
      if (!supabase) return MOCK_MAP_REPORTS;
      const { data } = await supabase
        .from('reports')
        .select('id, complaint_id, category, status, priority, address_locality, latitude, longitude, submitted_at')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(50);
      return (data && data.length > 0 ? (data as unknown as MapReportItem[]) : MOCK_MAP_REPORTS);
    },
  });

  const reports = liveReports || MOCK_MAP_REPORTS;

  const filteredReports = reports.filter((r) =>
    r.address_locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.complaint_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative bg-slate-950 overflow-hidden">
      {/* Top Search Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 max-w-lg mx-auto">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location or complaint ID in Navsari..."
            className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 shadow-2xl focus:outline-none focus:ring-2 focus:ring-swach-500"
          />
        </div>
      </div>

      {/* Interactive Map Visual */}
      <div className="flex-1 relative w-full h-full bg-[#0b1329] flex items-center justify-center overflow-hidden">
        {/* Stylized Navsari Street Grid Simulation */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Ambient Geographic Heatspots */}
        <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl top-1/4 left-1/3 pointer-events-none" />
        <div className="absolute w-80 h-80 rounded-full bg-amber-500/10 blur-3xl bottom-1/3 right-1/4 pointer-events-none" />

        {/* City Wards Reference Labels */}
        <div className="absolute top-20 left-8 text-[11px] font-bold text-slate-600 tracking-wider">
          WARD 7 — DUDHIA TALAV
        </div>
        <div className="absolute bottom-28 left-12 text-[11px] font-bold text-slate-600 tracking-wider">
          WARD 4 — LUNSIKUI MARKET
        </div>
        <div className="absolute top-28 right-16 text-[11px] font-bold text-slate-600 tracking-wider">
          WARD 5 — STATION ROAD
        </div>

        {/* Plotted Pins */}
        <div className="relative w-full max-w-md h-96 mx-auto">
          {filteredReports.map((report, idx) => {
            const isSelected = selectedReport?.id === report.id;
            // Deterministic positions for map visual
            const positions = [
              { top: '35%', left: '42%' },
              { top: '22%', left: '55%' },
              { top: '65%', left: '30%' },
              { top: '50%', left: '68%' },
            ];
            const pos = positions[idx % positions.length]!;

            let pinColor = 'bg-amber-500 text-amber-950 border-amber-300';
            if (report.status === 'in_progress') pinColor = 'bg-blue-500 text-blue-950 border-blue-300';
            if (report.status === 'resolved') pinColor = 'bg-emerald-500 text-emerald-950 border-emerald-300';

            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                style={{ top: pos.top, left: pos.left }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 z-10 ${
                  isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full ${pinColor} border-2 flex items-center justify-center shadow-lg shadow-black/50 font-bold text-xs`}
                >
                  <MapPin className="w-4 h-4 fill-current" />
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Selected Report Bottom Card */}
      {selectedReport && (
        <div className="absolute bottom-20 sm:bottom-6 left-4 right-4 z-20 max-w-md mx-auto">
          <div className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white tracking-wide">
                    {selectedReport.complaint_id}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                      STATUS_CONFIG[selectedReport.status]?.badgeClass || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {STATUS_CONFIG[selectedReport.status]?.label || selectedReport.status}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 mt-1">
                  {CATEGORY_LABELS[selectedReport.category]?.label || selectedReport.category}
                </h4>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-swach-400 shrink-0" />
                  <span className="truncate">{selectedReport.address_locality}</span>
                </div>
              </div>

              <Link
                to={`/reports/${selectedReport.id}`}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1 shrink-0 border border-slate-700 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </Link>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Priority: {selectedReport.priority.toUpperCase()}</span>
              </span>
              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${selectedReport.latitude},${selectedReport.longitude}`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
                className="text-swach-400 hover:text-swach-300 font-semibold flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                <span>Get Directions</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
