import type { ComplaintPriority } from '@/types/database.types';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlaBadgeProps {
  priority: ComplaintPriority;
  isOverdue?: boolean;
  isResolved?: boolean;
  className?: string;
}

export function SlaBadge({ priority, isOverdue, isResolved, className }: SlaBadgeProps) {
  if (isResolved) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
          className
        )}
      >
        <CheckCircle className="w-3 h-3 text-emerald-400" />
        Resolved
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse',
          className
        )}
      >
        <AlertCircle className="w-3 h-3 text-rose-400" />
        OVERDUE SLA
      </span>
    );
  }

  const priorityConfigs: Record<
    ComplaintPriority,
    { label: string; hours: number; colorClass: string }
  > = {
    urgent: { label: 'Urgent', hours: 24, colorClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
    high: { label: 'High', hours: 48, colorClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
    medium: { label: 'Medium', hours: 72, colorClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
    low: { label: 'Low', hours: 120, colorClass: 'bg-slate-800 text-slate-300 border-slate-700' },
  };

  const config = priorityConfigs[priority] || priorityConfigs.medium;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        config.colorClass,
        className
      )}
    >
      <Clock className="w-3 h-3 opacity-70" />
      <span>{config.label} ({config.hours}h)</span>
    </span>
  );
}
