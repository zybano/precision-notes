import type {ReactNode} from 'react';
interface PlatformModuleHeaderProps { title: string; description: string; actions?: ReactNode; }
export default function PlatformModuleHeader({title, description, actions}: PlatformModuleHeaderProps) {
  return <div className="flex flex-wrap items-start justify-between gap-4 pb-1">
    <div><h1 className="text-[32px] font-semibold leading-tight tracking-tight text-[#14213d] md:text-[38px]">{title}</h1>
    <p className="mt-2 text-base leading-6 text-slate-500">{description}</p></div>
    {actions && <div className="flex items-center gap-2 pt-1">{actions}</div>}
  </div>;
}
