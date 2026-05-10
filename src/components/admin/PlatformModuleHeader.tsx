interface PlatformModuleHeaderProps {
  title: string;
  description: string;
}

export default function PlatformModuleHeader({ title, description }: PlatformModuleHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
