import {ReactNode} from 'react';
import {CheckCircle2, Copy, Loader2, XCircle} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<Tone, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-700',
};

interface AdminMetricTileProps {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}

export function AdminMetricTile({label, value, helper, icon, tone = 'neutral'}: AdminMetricTileProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-2 text-2xl font-semibold leading-none text-slate-950">{value}</div>
          {helper && <p className="mt-2 text-xs text-slate-500">{helper}</p>}
        </div>
        {icon && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md border', toneClasses[tone])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface AdminSectionPanelProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AdminSectionPanel({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: AdminSectionPanelProps) {
  return (
    <Card className={cn('overflow-hidden border-slate-200 shadow-none', className)}>
      <CardHeader className="flex flex-col space-y-0 gap-3 bg-white p-4 md:flex-row md:items-start md:justify-between md:px-5">
        <div className="min-w-0">
          <CardTitle className="text-[22px] font-semibold tracking-tight text-[#14213d]">{title}</CardTitle>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className={cn('px-4 pb-4 pt-0 md:px-5 md:pb-5', contentClassName)}>{children}</CardContent>
    </Card>
  );
}

interface AdminStatusPillProps {
  children: ReactNode;
  tone?: Tone;
  icon?: 'success' | 'danger' | 'loading';
  className?: string;
}

export function AdminStatusPill({children, tone = 'neutral', icon, className}: AdminStatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        toneClasses[tone],
        className
      )}
    >
      {icon === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
      {icon === 'danger' && <XCircle className="h-3.5 w-3.5" />}
      {icon === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </span>
  );
}

interface AdminJsonResultProps {
  title?: string;
  data: unknown;
  className?: string;
}

export function AdminJsonResult({title = 'Result', data, className}: AdminJsonResultProps) {
  const value = JSON.stringify(data, null, 2);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Result copied');
    } catch {
      toast.error('Unable to copy result');
    }
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-slate-100', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">{title}</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-slate-300 hover:bg-white/10 hover:text-white"
          onClick={copyResult}
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto p-3 text-xs leading-5 text-slate-100">{value}</pre>
    </div>
  );
}

interface AudioVisualizerProps {
  active?: boolean;
  compact?: boolean;
  label?: string;
}

export function AudioVisualizer({active = false, compact = false, label}: AudioVisualizerProps) {
  const bars = compact ? 18 : 28;

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4',
        compact ? 'min-h-24' : 'min-h-36'
      )}
    >
      <div className="flex h-full min-h-20 items-end justify-center gap-1.5">
        {Array.from({length: bars}).map((_, index) => (
          <span
            key={index}
            className={cn(
              'admin-audio-bar block w-1.5 rounded-full bg-indigo-500/80',
              active ? 'is-active' : 'opacity-50'
            )}
            style={{
              height: `${18 + ((index * 13) % 46)}%`,
              animationDelay: `${index * 70}ms`,
            }}
          />
        ))}
      </div>
      {label && <p className="mt-3 text-center text-xs font-medium text-slate-500">{label}</p>}
    </div>
  );
}

export function AdminTableShell({children, className}: {children: ReactNode; className?: string}) {
  return <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>{children}</div>;
}

export function AdminEmptyState({children}: {children: ReactNode}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function AdminBadge({children, variant}: {children: ReactNode; variant?: 'default' | 'secondary' | 'outline'}) {
  return <Badge variant={variant}>{children}</Badge>;
}

export function AdminMetricStrip({items}: {items: Array<{label: string; value: ReactNode; helper?: ReactNode; success?: boolean}>}) {
  return <div className="grid grid-cols-2 divide-x divide-slate-100 rounded-lg border border-slate-200 bg-white py-6 md:grid-cols-4">
    {items.map(item => <div key={item.label} className="px-5 md:px-7"><p className="text-sm text-slate-500">{item.label}</p>
      <p className={cn('mt-2 text-3xl font-semibold tracking-tight', item.success ? 'text-emerald-700' : 'text-[#14213d]')}>{item.value}</p>
      {item.helper && <p className="mt-2 text-xs text-slate-500">{item.helper}</p>}</div>)}
  </div>;
}
