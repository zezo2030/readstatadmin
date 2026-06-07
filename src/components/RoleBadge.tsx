import { useTranslation } from 'react-i18next';
import type { Role } from '@/api/types';

const styles: Record<string, string> = {
  RegularUser:
    'bg-[hsl(var(--role-user-bg))] text-[hsl(var(--role-user-fg))]',
  Broker: 'bg-[hsl(var(--role-broker-bg))] text-[hsl(var(--role-broker-fg))]',
  Admin: 'bg-[hsl(var(--role-admin-bg))] text-[hsl(var(--role-admin-fg))]',
};

export function RoleBadge({ role }: { role?: Role | null }) {
  const { t } = useTranslation();
  if (!role) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles[role] ?? ''}`}
    >
      {t(`roles.${role}`)}
    </span>
  );
}
