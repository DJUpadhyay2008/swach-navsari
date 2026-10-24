import { useState, useMemo } from 'react';
import type { ReportRow } from '../types';
import { NAVSARI_WARDS, CATEGORY_LABELS, formatDate } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { SlaBadge } from './SlaBadge';
import { MapPin, Navigation, ExternalLink, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface NavsariInteractiveMapProps {
  reports: ReportRow[];
  onSelectReport?: (report: ReportRow) => void;
}

// Bounding box for Navsari Urban Municipal Area
const NAVSARI_BOUNDS = {
  minLat: 20.915,
  maxLat: 20.975,
  minLng: 72.895,
  maxLng: 72.965,
};

// SVG dimensions
const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;

function projectCoords(lat: number, lng: number): { x: number; y: number } {
  const normX = (lng - NAVSARI_BOUNDS.minLng) / (NAVSARI_BOUNDS.maxLng - NAVSARI_BOUNDS.minLng);
  // Latitude goes upwards, SVG y goes downwards
  const normY = (NAVSARI_BOUNDS.maxLat - lat) / (NAVSARI_BOUNDS.maxLat - NAVSARI_BOUNDS.minLat);

  // Clamp within bounds with margin
  const x = Math.max(30, Math.min(SVG_WIDTH - 30, normX * (SVG_WIDTH - 60) + 30));
  const y = Math.max(30, Math.min(SVG_HEIGHT - 30, normY * (SVG_HEIGHT - 60) + 30));

  return { x, y };
}

// Ward centroid approximate coordinates for visualization
const WARD_CENTROIDS: Record<number, { lat: number; lng: number }> = {
  1: { lat: 20.965, lng: 72.915 }, // Gandevi Rd / Grid Substation
  2: { lat: 20.932, lng: 72.905 }, // Dandi Heritage / Viraval
  3: { lat: 20.925, lng: 72.935 }, // Vijalpore Sector
  4: { lat: 20.947, lng: 72.928 }, // Lunsikui / Sardar Complex
  5: { lat: 20.949, lng: 72.938 }, // Station Road / Clock Tower
  6: { lat: 20.951, lng: 72.925 }, // Junathana / Old City
  7: { lat: 20.953, lng: 72.933 }, // Dudhia Talav
  8: { lat: 20.938, lng: 72.955 }, // Chhapra Road / GIDC
  9: { lat: 20.962, lng: 72.952 }, // Kabilpore Civic
  10: { lat: 20.941, lng: 72.921 }, // Jalalpore / Ashapuri
  11: { lat: 20.958, lng: 72.941 }, // Shantadevi Rd / Civil Hospital
  12: { lat: 20.943, lng: 72.946 }, // Kaliawadi Residential
  13: { lat: 20.955, lng: 72.921 }, // Sayaji Vaibhav / Tarota
};

export function NavsariInteractiveMap({ reports, onSelectReport }: NavsariInteractiveMapProps) {
  const [selectedWard, setSelectedWard] = useState<number | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);

  // Filter valid reports with GPS
  const validGeoReports = useMemo(() => {
    return reports.filter(
      (r) =>
        r.latitude !== null &&
        r.longitude !== null &&
        r.latitude >= 20.8 &&
        r.latitude <= 21.1 &&
        r.longitude >= 72.8 &&
        r.longitude <= 73.15
    );
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (selectedWard === 'all') return validGeoReports;
    return validGeoReports.filter((r) => r.ward_number === selectedWard);
  }, [validGeoReports, selectedWard]);

  const reportsWithoutCoordsCount = reports.length - validGeoReports.length;

  return (
    <div className="space-y-4">
      {/* Controls & Ward Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-[#087F7B]" />
          <span className="text-xs font-semibold text-[#172B3A]">
            Navsari Municipal Geographic Distribution
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-teal-50 text-[#087F7B] font-semibold border border-teal-200">
            {filteredReports.length} Plotted Pins
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-[#64748B]">Filter Ward:</span>
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[#172B3A] focus:outline-none focus:ring-1 focus:ring-[#087F7B]"
          >
            <option value="all">All 13 Civic Wards</option>
            {NAVSARI_WARDS.map((w) => (
              <option key={w.number} value={w.number}>
                Ward {w.number}: {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {reportsWithoutCoordsCount > 0 && (
        <div className="px-4 py-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
          <span>
            ℹ️ <strong className="font-semibold">{reportsWithoutCoordsCount} complaints</strong> were filed with descriptive street locality only (GPS was disabled by the citizen).
          </span>
          <span className="text-[11px] text-amber-700">Displaying {validGeoReports.length} geotagged items</span>
        </div>
      )}

      {/* Map Canvas & Selected Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SVG Map Canvas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
          <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-50 to-teal-50/30 rounded-xl border border-slate-100 overflow-hidden">
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="w-full h-full select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Water feature: Purna River / Dudhia Talav stylistic hint */}
              <circle
                cx={projectCoords(20.953, 72.933).x}
                cy={projectCoords(20.953, 72.933).y}
                r="38"
                fill="#CCECEB"
                opacity="0.6"
              />
              <text
                x={projectCoords(20.953, 72.933).x}
                y={projectCoords(20.953, 72.933).y + 3}
                textAnchor="middle"
                fontSize="9"
                fill="#087F7B"
                fontWeight="600"
              >
                Dudhia Talav
              </text>

              {/* 13 Ward Zones & Centroids */}
              {NAVSARI_WARDS.map((w) => {
                const coord = WARD_CENTROIDS[w.number] || { lat: 20.95, lng: 72.93 };
                const pt = projectCoords(coord.lat, coord.lng);
                const isCurrent = selectedWard === w.number;

                return (
                  <g key={w.number} className="transition-all cursor-pointer" onClick={() => setSelectedWard(w.number)}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isCurrent ? '34' : '28'}
                      fill={isCurrent ? '#087F7B' : '#E2E8F0'}
                      fillOpacity={isCurrent ? '0.15' : '0.4'}
                      stroke={isCurrent ? '#087F7B' : '#CBD5E1'}
                      strokeWidth={isCurrent ? '1.5' : '1'}
                      strokeDasharray={isCurrent ? 'none' : '3 3'}
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={isCurrent ? '#087F7B' : '#475569'}
                    >
                      W-{w.number}
                    </text>
                    <text
                      x={pt.x}
                      y={pt.y + 4}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#64748B"
                    >
                      {w.name.split('&')[0]?.trim() || w.name}
                    </text>
                  </g>
                );
              })}

              {/* Plotted Complaint Pins */}
              {filteredReports.map((r) => {
                const pt = projectCoords(r.latitude!, r.longitude!);
                const isSelected = selectedReport?.id === r.id;

                let pinColor = '#3B82F6'; // default blue
                if (r.priority === 'urgent') pinColor = '#E11D48'; // red
                else if (r.priority === 'high') pinColor = '#F59E0B'; // amber
                if (r.status === 'resolved') pinColor = '#10B981'; // green

                return (
                  <g
                    key={r.id}
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={() => {
                      setSelectedReport(r);
                      onSelectReport?.(r);
                    }}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? '9' : '6'}
                      fill={pinColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="shadow-md"
                    />
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="15"
                        fill="none"
                        stroke={pinColor}
                        strokeWidth="1.5"
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 flex items-center gap-3">
              <span className="font-semibold text-slate-800">Pin Legend:</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600" /> Urgent
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Med/Low
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Resolved
              </span>
            </div>
          </div>
        </div>

        {/* Selected Complaint Inspector Sheet */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          {selectedReport ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold text-[#087F7B] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedReport.complaint_id}
                  </span>
                  <h4 className="text-sm font-bold text-[#172B3A] mt-2">
                    {CATEGORY_LABELS[selectedReport.category]?.label || selectedReport.category}
                  </h4>
                </div>
                <StatusBadge status={selectedReport.status} />
              </div>

              <div className="space-y-2 text-xs text-[#64748B]">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#087F7B] shrink-0 mt-0.5" />
                  <span>
                    Ward {selectedReport.ward_number || '—'} — {selectedReport.address_locality || 'Navsari'}
                    {selectedReport.landmark ? ` (${selectedReport.landmark})` : ''}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 font-mono text-[11px] text-slate-600">
                  GPS: {selectedReport.latitude?.toFixed(4)}, {selectedReport.longitude?.toFixed(4)}
                </div>

                <p className="line-clamp-3 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                  "{selectedReport.description}"
                </p>

                <div className="flex items-center justify-between pt-1">
                  <SlaBadge priority={selectedReport.priority} isResolved={selectedReport.status === 'resolved'} />
                  <span className="text-[11px] text-slate-400">
                    {formatDate(selectedReport.submitted_at)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link to={`/admin/reports/${selectedReport.id}`} className="w-full block">
                  <Button
                    size="sm"
                    className="w-full bg-[#087F7B] hover:bg-[#066461] text-white"
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Open Triage Console
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F7B]">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#172B3A]">No Pin Selected</p>
              <p className="text-xs text-[#64748B]">
                Click on any colored complaint marker or ward area on the map to inspect location telemetry, urgency SLA, and quick actions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
