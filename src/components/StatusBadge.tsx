import { Badge, type BadgeProps } from '@/components/ui/badge';

type Variant = BadgeProps['variant'];

/** Maps a backend status string to a semantic badge variant + i18n label. */
export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: Variant;
}) {
  return <Badge variant={tone}>{label}</Badge>;
}

export const moderationTone = (
  status: 'active' | 'pending_review' | 'rejected',
): Variant =>
  status === 'active'
    ? 'success'
    : status === 'pending_review'
      ? 'warning'
      : 'destructive';

export const requestTone = (
  status: 'open' | 'in_progress' | 'closed',
): Variant =>
  status === 'open' ? 'success' : status === 'in_progress' ? 'warning' : 'secondary';

export const reportTone = (
  status: 'open' | 'resolved' | 'dismissed',
): Variant =>
  status === 'open' ? 'warning' : status === 'resolved' ? 'success' : 'secondary';
