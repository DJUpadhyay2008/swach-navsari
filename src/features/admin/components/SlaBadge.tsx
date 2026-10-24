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
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200',
          className
        )}
      >
        <CheckCircle className="w-3 h-3 text-emerald-600" />
        Resolved
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse',
          className
        )}
      >
        <AlertCircle className="w-3 h-3 text-rose-600" />
        OVERDUE SLA
      </span>
    );
  }

  const priorityConfigs: Record<
    ComplaintPriority,
    { label: string; hours: number; colorClass: string }
  > = {
    urgent: { label: 'Urgent', hours: 24, colorClass: 'bg-rose-50 text-rose-700 border-rose-200' },
    high: { label: 'High', hours: 48, colorClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    medium: { label: 'Medium', hours: 72, colorClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    low: { label: 'Low', hours: 120, colorClass: 'bg-slate-50 text-slate-600 border-slate-200' },
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
