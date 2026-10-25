import { isSupabaseConfigured } from '@/lib/supabase/client';
import { AlertTriangle, Key } from 'lucide-react';

export function ConfigBanner() {
  const configured = isSupabaseConfigured();

  if (configured) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Local Backend Configuration Notice:</strong> Supabase credentials are not
            configured yet. Local schema migrations and policies are ready in{' '}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800 border border-amber-300 font-mono">
              supabase/migrations/
            </code>
            .
          </span>
        </div>
        <div className="flex items-center gap-2 text-amber-800">
          <Key className="w-3.5 h-3.5 text-amber-600" />
          <span>
            Copy <code className="font-mono font-semibold">.env.example</code> to{' '}
            <code className="font-mono font-semibold">.env</code> and set{' '}
            <code className="font-mono font-semibold">VITE_SUPABASE_URL</code> &{' '}
            <code className="font-mono font-semibold">VITE_SUPABASE_ANON_KEY</code>.
          </span>
        </div>
      </div>
    </div>
  );
}
