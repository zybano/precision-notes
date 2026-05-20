import {Loader2} from 'lucide-react';

interface AdminAuthProgressOverlayProps {
  title: string;
  description: string;
}

export function AdminAuthProgressOverlay({
  title,
  description,
}: AdminAuthProgressOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 text-left shadow-[0_20px_70px_rgba(15,23,42,0.18)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">{title}</p>
            <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
