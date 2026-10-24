import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase/client';
import { Search, MapPin, Navigation, Eye } from 'lucide-react';
import { STATUS_CONFIG, CATEGORY_LABELS } from '@/lib/utils';
import type { ComplaintStatus, ComplaintCategory } from '@/types/database.types';

interface MapReportItem {
  id: string;
  complaint_id: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: string;
  latitude: number;
  longitude: number;
  address_locality: string;
}

const DEFAULT_MAP_PINS: MapReportItem[] = [
  {
    id: '1',
    complaint_id: 'NMC202610120457',
    category: 'garbage_dump',
    status: 'in_progress',
    priority: 'high',
    latitude: 20.9467,
    longitude: 72.9281,
    address_locality: 'Near Navsari Bus Stand',
  },
  {
    id: '2',
    complaint_id: 'NMC202610110321',
    category: 'overflowing_bin',
    status: 'submitted',
    priority: 'medium',
    latitude: 20.9382,
    longitude: 72.9548,
    address_locality: 'GIDC Industrial Gate 2',
  },
  {
    id: '3',
    complaint_id: 'NMC202610100021',
    category: 'construction_debris',
    status: 'resolved',
    priority: 'low',
    latitude: 20.9578,
    longitude: 72.9412,
    address_locality: 'College Road, Civil Area',
  },
  {
    id: '4',
    complaint_id: 'NMC202610090137',
    category: 'drainage_blockage',
    status: 'submitted',
    priority: 'high',
    latitude: 20.9525,
    longitude: 72.9329,
    address_locality: 'Lunsikui Ring Road',
  },
];

export function IssueMapPage() {
  const [selectedReport, setSelectedReport] = useState<MapReportItem | null>(
    DEFAULT_MAP_PINS[0] ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');

  const { data: reports = DEFAULT_MAP_PINS } = useQuery({
    queryKey: ['citizen-map-pins'],
    queryFn: async () => {
      const supabase = getSupabase();
      if (!supabase) return DEFAULT_MAP_PINS;
      const { data, error } = await supabase
        .from('reports')
        .select('id, complaint_id, category, status, priority, latitude, longitude, address_locality')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(20);

      if (error || !data || data.length === 0) return DEFAULT_MAP_PINS;
      return data as MapReportItem[];
    },
  });

  const filteredReports = reports.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.complaint_id.toLowerCase().includes(q) ||
      (r.address_locality && r.address_locality.toLowerCase().includes(q)) ||
      (CATEGORY_LABELS[r.category]?.label || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full flex flex-col bg-slate-100 overflow-hidden text-slate-900">
      {/* Search & Ward Filter Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 max-w-md mx-auto">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location or complaint ID in Navsari..."
            className="w-full bg-white/95 backdrop-blur-md border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Interactive Map Visual */}
      <div className="flex-1 relative w-full h-full bg-[#eef2f6] flex items-center justify-center overflow-hidden">
        {/* Stylized Navsari Street Grid Simulation */}
        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Ambient Geographic Heatspots */}
        <div className="absolute w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl top-1/4 left-1/3 pointer-events-none" />
        <div className="absolute w-80 h-80 rounded-full bg-amber-400/20 blur-3xl bottom-1/3 right-1/4 pointer-events-none" />

        {/* Simulated Road Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
          <path d="M 0 180 Q 200 120 400 240 T 800 200" fill="none" stroke="#cbd5e1" strokeWidth="12" />
          <path d="M 220 0 L 260 600" fill="none" stroke="#94a3b8" strokeWidth="8" />
          <path d="M 450 0 L 410 600" fill="none" stroke="#cbd5e1" strokeWidth="6" />
        </svg>

        {/* City Wards Reference Labels */}
        <div className="absolute top-20 left-8 text-[11px] font-bold text-slate-500 tracking-wider">
          WARD 7 — DUDHIA TALAV
        </div>
        <div className="absolute bottom-28 left-12 text-[11px] font-bold text-slate-500 tracking-wider">
          WARD 4 — LUNSIKUI MARKET
        </div>
        <div className="absolute top-28 right-16 text-[11px] font-bold text-slate-500 tracking-wider">
          WARD 5 — STATION ROAD
        </div>

        {/* Plotted Pins */}
        <div className="relative w-full max-w-md h-96 mx-auto">
          {filteredReports.map((report, idx) => {
            const isSelected = selectedReport?.id === report.id;
            const positions = [
              { top: '35%', left: '42%' },
              { top: '22%', left: '55%' },
              { top: '65%', left: '30%' },
              { top: '50%', left: '68%' },
            ];
            const pos = positions[idx % positions.length]!;

            let pinColor = 'bg-amber-500 text-white border-white';
            if (report.status === 'in_progress') pinColor = 'bg-blue-600 text-white border-white';
            if (report.status === 'resolved') pinColor = 'bg-emerald-600 text-white border-white';

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
                  className={`w-9 h-9 rounded-full ${pinColor} border-2 flex items-center justify-center shadow-lg font-bold text-xs`}
                >
                  <MapPin className="w-4 h-4 fill-current" />
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Selected Report Bottom Card */}
      {selectedReport && (
        <div className="absolute bottom-20 sm:bottom-6 left-4 right-4 z-20 max-w-md mx-auto">
          <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900 tracking-wide">
                    {selectedReport.complaint_id}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                      STATUS_CONFIG[selectedReport.status]?.badgeClass || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {STATUS_CONFIG[selectedReport.status]?.label || selectedReport.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 mt-1">
                  {CATEGORY_LABELS[selectedReport.category]?.label || selectedReport.category}
                </h4>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{selectedReport.address_locality}</span>
                </div>
              </div>

              <Link
                to={`/reports/${selectedReport.id}`}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0 border border-slate-200 transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>Details</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                GPS: {selectedReport.latitude}, {selectedReport.longitude}
              </span>
              <a
                href={`https://maps.google.com/?q=${selectedReport.latitude},${selectedReport.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 text-[11px]"
              >
                <Navigation className="w-3 h-3" />
                <span>Navigate</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
