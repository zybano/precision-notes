import {ReactNode} from 'react';
import {Label} from '@/components/ui/label';

interface AdminFormFieldProps {
  label: string;
  htmlFor?: string;
  helperText?: string;
  errorText?: string;
  className?: string;
  children: ReactNode;
}

export default function AdminFormField({
  label,
  htmlFor,
  helperText,
  errorText,
  className,
  children,
}: AdminFormFieldProps) {
  return (
    <div className={className ? `space-y-1 ${className}` : 'space-y-1'}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {helperText && !errorText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      {errorText && <p className="text-xs text-destructive">{errorText}</p>}
    </div>
  );
}
