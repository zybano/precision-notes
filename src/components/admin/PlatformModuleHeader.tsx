interface PlatformModuleHeaderProps {
  title: string;
  description: string;
}

export default function PlatformModuleHeader({ title, description }: PlatformModuleHeaderProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Control module</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
