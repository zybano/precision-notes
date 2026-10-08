import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {AdminTableShell} from '@/components/admin/AdminSurface';
import type {BillingOwnerUsage} from '@/types/platformAdmin';

export function formatQuantity(value: number | undefined) {
  return value == null ? '—' : Number(value).toLocaleString(undefined, {maximumFractionDigits: 2});
}
export function formatDuration(seconds: number | undefined) {
  if (seconds == null) return '—';
  if (seconds < 60) return `${formatQuantity(seconds)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${formatQuantity(seconds / 60)} min`;
}
export function BillingOwnersTable({owners, loading, error, compact = false}: {owners: BillingOwnerUsage[]; loading?: boolean; error?: string; compact?: boolean}) {
  return <AdminTableShell><Table><TableHeader><TableRow>
    <TableHead>{compact ? 'Organization' : 'Customer'}</TableHead>
    <TableHead>AI actions used</TableHead><TableHead>Transcription used</TableHead>
    {!compact && <><TableHead>Completed actions</TableHead><TableHead>Available balance</TableHead></>}
    {compact && <TableHead>Permanent balance</TableHead>}
  </TableRow></TableHeader><TableBody>
    {(loading || error || !owners.length) && <TableRow><TableCell colSpan={compact ? 4 : 5} className={error ? 'text-destructive' : 'text-slate-500'}>
      {loading ? 'Loading usage…' : error || 'No customers match this scope.'}</TableCell></TableRow>}
    {!loading && !error && owners.map(owner => <TableRow key={`${owner.ownerType}:${owner.ownerId}`}>
      <TableCell className="font-medium">{owner.ownerName}{!compact && <p className="mt-1 text-xs text-slate-500">{owner.ownerType === 'B2B' ? 'Organization' : 'Individual'}</p>}</TableCell>
      <TableCell>{formatQuantity(owner.aiActionsUsed)}</TableCell><TableCell>{formatDuration(owner.transcriptionSecondsUsed)}</TableCell>
      {!compact && <><TableCell>{formatQuantity(owner.completedActions)}</TableCell><TableCell>{formatQuantity(owner.remainingAiActions)} actions<p className="mt-1 text-xs text-slate-500">{formatDuration(owner.remainingTranscriptionSeconds)} transcription</p></TableCell></>}
      {compact && <TableCell>{formatQuantity(owner.permanentAiActions)} actions · {formatDuration(owner.permanentTranscriptionSeconds)}</TableCell>}
    </TableRow>)}
  </TableBody></Table></AdminTableShell>;
}
export function formatCapturedPayment(amount: number, currency: string) {
  try {
    const formatter = new Intl.NumberFormat(undefined, {style: 'currency', currency});
    return formatter.format(amount / 10 ** formatter.resolvedOptions().maximumFractionDigits);
  } catch { return `${formatQuantity(amount)} minor units (${currency})`; }
}
