import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const NAVSARI_WARDS = [
  { number: 1, name: 'Gandevi Road & Grid Substation', keyLandmarks: ['Grid Chokdi', 'Gandevi Bypass'] },
  { number: 2, name: 'Dandi Heritage Corridor & Viraval', keyLandmarks: ['Viraval Crossroad', 'Dandi Approach'] },
  { number: 3, name: 'Vijalpore Heritage Sector', keyLandmarks: ['Vijalpore Main Market', 'Railway Colony'] },
  { number: 4, name: 'Lunsikui & Sardar Complex', keyLandmarks: ['Sardar Patel Stadium', 'Vegetable Market'] },
  { number: 5, name: 'Station Road & Tower Bazaar', keyLandmarks: ['Clock Tower (Ghanta Ghar)', 'Navsari Railway Station'] },
  { number: 6, name: 'Junathana & Old City Central', keyLandmarks: ['Tariaghat', 'Old Court Compound'] },
  { number: 7, name: 'Dudhia Talav & Fuwara Lakefront', keyLandmarks: ['Dudhia Talav Promenade', 'Children Play Park'] },
  { number: 8, name: 'Chhapra Road & GIDC Industrial', keyLandmarks: ['Chhapra Octroi Point', 'Diamond Processing Hub'] },
  { number: 9, name: 'Kabilpore Civic Extension', keyLandmarks: ['National Highway 48 Feeder', 'Kabilpore Talav'] },
  { number: 10, name: 'Jalalpore & Ashapuri Temple Sector', keyLandmarks: ['Ashapuri Mata Mandir', 'Jalalpore Central Road'] },
  { number: 11, name: 'Shantadevi Road & Civil Hospital', keyLandmarks: ['Navsari Civil Hospital', 'Rotary Eye Institute'] },
  { number: 12, name: 'Kaliawadi Residential Zone', keyLandmarks: ['Kaliawadi Canal Road', 'Subhash Chandra Bose Garden'] },
  { number: 13, name: 'Sayaji Vaibhav Library & Tarota', keyLandmarks: ['Sayaji Vaibhav Library', 'Tarota Bazaar'] },
];

export const CATEGORY_LABELS: Record<ComplaintCategory, { label: string; gujarati: string; description: string }> = {
  garbage_dump: {
    label: 'Open Garbage Dump',
    gujarati: 'ખુલ્લો કચરો / કચરાનો ઢગલો',
    description: 'Accumulation of uncollected domestic or commercial solid waste',
  },
  overflowing_bin: {
    label: 'Overflowing Community Bin',
    gujarati: 'ઉભરાતી કચરાપેટી',
    description: 'Municipal garbage container filled past capacity',
  },
  dead_animal: {
    label: 'Animal Carcass / Dead Animal',
    gujarati: 'મૃત પ્રાણી નિકાલ',
    description: 'Urgent sanitary removal of deceased animals from public roads',
  },
  sewage_overflow: {
    label: 'Sewage / Drainage Overflow',
    gujarati: 'ગટર ઉભરાવી / ગંદુ પાણી',
    description: 'Blocked manhole, sewer backup, or dirty wastewater spillage',
  },
  construction_debris: {
    label: 'Construction & Demolition Debris',
    gujarati: 'બાંધકામનો કાટમાળ',
    description: 'Illegal dumping of concrete, bricks, or road excavation sand',
  },
  open_defecation: {
    label: 'Sanitation / Open Urination Spot',
    gujarati: 'જાહેર શૌચ / સ્વચ્છતા સમસ્યા',
    description: 'Unsanitary public nuisance requiring immediate disinfection',
  },
  drainage_blockage: {
    label: 'Stormwater Drain Blockage',
    gujarati: 'વરસાદી ગટર બ્લોકેજ',
    description: 'Leaves, plastics, or silt clogging stormwater outlets',
  },
  hazardous_waste: {
    label: 'Hazardous / Medical Waste',
    gujarati: 'જોખમી કચરો',
    description: 'Bio-medical sharps, industrial chemicals, or electronic hazards',
  },
  other: {
    label: 'Other Cleanliness Issue',
    gujarati: 'અન્ય સ્વચ્છતા ફરિયાદ',
    description: 'Any civic cleanliness complaint not covered above',
  },
};

export const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; badgeClass: string; step: number; description: string }
> = {
  submitted: {
    label: 'Submitted',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    step: 1,
    description: 'Complaint registered by citizen and queued for triage',
  },
  under_review: {
    label: 'Under Review',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    step: 2,
    description: 'Municipal official is assessing location, ward, and urgency',
  },
  assigned: {
    label: 'Worker Assigned',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    step: 3,
    description: 'Assigned to ward sanitation worker crew for on-site action',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    step: 4,
    description: 'Sanitation crew is actively working at the site',
  },
  resolution_submitted: {
    label: 'Resolution Submitted',
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    step: 5,
    description: 'Cleanliness evidence uploaded by worker; awaiting verification',
  },
  resolved: {
    label: 'Resolved & Verified',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    step: 6,
    description: 'Issue successfully cleared and verified by authorities/citizen',
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    step: -1,
    description: 'Complaint could not be accepted with reason documented',
  },
  reopened: {
    label: 'Reopened',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    step: 4,
    description: 'Citizen contested the resolution within 72h window',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    step: -1,
    description: 'Complaint cancelled by citizen or municipal official',
  },
};

export const PRIORITY_CONFIG: Record<
  ComplaintPriority,
  { label: string; badgeClass: string; slaHours: number }
> = {
  low: {
    label: 'Low Priority',
    badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    slaHours: 120,
  },
  medium: {
    label: 'Medium Priority',
    badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    slaHours: 72,
  },
  high: {
    label: 'High Priority',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    slaHours: 48,
  },
  urgent: {
    label: 'Urgent Action (24h)',
    badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    slaHours: 24,
  },
};

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}
