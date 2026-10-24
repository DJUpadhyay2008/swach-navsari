import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
}

export function Alert({
  className,
  variant = 'info',
  title,
  children,
  ...props
}: AlertProps) {
  const icons = {
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  };

  const variants = {
    info: 'bg-blue-950/40 border-blue-800/60 text-blue-200',
    warning: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
    success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
    error: 'bg-rose-950/40 border-rose-800/60 text-rose-200',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3.5 p-4 rounded-xl border backdrop-blur-sm text-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      <div className="pt-0.5">{icons[variant]}</div>
      <div className="space-y-1">
        {title && <h5 className="font-semibold text-white tracking-tight">{title}</h5>}
        <div className="text-sm opacity-90 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
