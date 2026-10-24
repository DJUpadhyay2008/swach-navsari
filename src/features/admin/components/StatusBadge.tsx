import type { ReactNode } from 'react';
import type { ComplaintStatus } from '@/types/database.types';
import {
  Clock,
  Eye,
  UserCheck,
  PlayCircle,
  FileCheck2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const configs: Record<
    ComplaintStatus,
    { label: string; icon: ReactNode; colorClass: string }
  > = {
    submitted: {
      label: 'Submitted',
      icon: <Clock className="w-3 h-3 text-amber-400" />,
      colorClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    },
    under_review: {
      label: 'Under Review',
      icon: <Eye className="w-3 h-3 text-indigo-400" />,
      colorClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    },
    assigned: {
      label: 'Worker Assigned',
      icon: <UserCheck className="w-3 h-3 text-cyan-400" />,
      colorClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    },
    in_progress: {
      label: 'In Progress',
      icon: <PlayCircle className="w-3 h-3 text-blue-400" />,
      colorClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    },
    resolution_submitted: {
      label: 'Awaiting Verification',
      icon: <FileCheck2 className="w-3 h-3 text-teal-400" />,
      colorClass: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
    },
    resolved: {
      label: 'Resolved',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
      colorClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    },
    rejected: {
      label: 'Rejected',
      icon: <XCircle className="w-3 h-3 text-rose-400" />,
      colorClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    },
    reopened: {
      label: 'Reopened',
      icon: <RotateCcw className="w-3 h-3 text-orange-400" />,
      colorClass: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
    },
    cancelled: {
      label: 'Cancelled',
      icon: <Ban className="w-3 h-3 text-slate-400" />,
      colorClass: 'bg-slate-800 text-slate-300 border-slate-700',
    },
  };

  const config = configs[status] || configs.submitted;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.colorClass,
        className
      )}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
}
