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
      icon: <Clock className="w-3 h-3 text-amber-600" />,
      colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    under_review: {
      label: 'Under Review',
      icon: <Eye className="w-3 h-3 text-indigo-600" />,
      colorClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
    assigned: {
      label: 'Worker Assigned',
      icon: <UserCheck className="w-3 h-3 text-cyan-600" />,
      colorClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    },
    in_progress: {
      label: 'In Progress',
      icon: <PlayCircle className="w-3 h-3 text-blue-600" />,
      colorClass: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    resolution_submitted: {
      label: 'Awaiting Verification',
      icon: <FileCheck2 className="w-3 h-3 text-teal-600" />,
      colorClass: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    resolved: {
      label: 'Resolved',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
      colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    rejected: {
      label: 'Rejected',
      icon: <XCircle className="w-3 h-3 text-rose-600" />,
      colorClass: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    reopened: {
      label: 'Reopened',
      icon: <RotateCcw className="w-3 h-3 text-orange-600" />,
      colorClass: 'bg-orange-50 text-orange-800 border-orange-200',
    },
    cancelled: {
      label: 'Cancelled',
      icon: <Ban className="w-3 h-3 text-slate-500" />,
      colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
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
