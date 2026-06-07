import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import {
  Building2,
  ClipboardList,
  Flag,
  Users,
  Bell,
  UserCheck,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { getStats } from '@/api/endpoints';
import { Card, Skeleton, Chip } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';
import { formatNumber } from '@/lib/format';
import type { Role } from '@/api/types';

const ROLES: Role[] = ['RegularUser', 'Broker', 'Admin'];
const PROP_STATUSES = ['active', 'pending_review', 'rejected', 'deleted'] as const;
const REQ_STATUSES = ['open', 'in_progress', 'closed'] as const;

export function StatsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const kpis = [
    {
      key: 'users',
      icon: Users,
      value: data?.users.total,
      label: t('stats.users'),
      gradient: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
      iconColor: 'text-blue-500 dark:text-blue-400',
    },
    {
      key: 'properties',
      icon: Building2,
      value: data?.properties.total,
      label: t('stats.properties'),
      gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
    },
    {
      key: 'requests',
      icon: ClipboardList,
      value: data?.requests.total,
      label: t('stats.requests'),
      gradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
    {
      key: 'reports',
      icon: Flag,
      value: data?.reports.open,
      label: `${t('stats.reports')} · ${t('stats.open')}`,
      gradient: 'from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20',
      iconColor: 'text-rose-500 dark:text-rose-400',
    },
  ];

  const usersByRole = ROLES.map((r) => ({
    name: t(`roles.${r}`),
    value: data?.users.byRole?.[r] ?? 0,
  }));
  const propsByStatus = PROP_STATUSES.map((s) => ({
    name: s === 'deleted' ? s : t(`properties.moderation.${s}`),
    value: data?.properties.byStatus?.[s] ?? 0,
  }));
  const reqByStatus = REQ_STATUSES.map((s) => ({
    name: t(`requests.state.${s}`),
    value: data?.requests.byStatus?.[s] ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="border-none bg-primary text-primary-foreground shadow-lg">
        <Card.Content className="p-6 md:p-8">
          <div className="max-w-xl space-y-2">
            <h1 className="text-2xl font-bold md:text-3xl">
              {t('app.title')} {t('stats.title')}
            </h1>
            <p className="text-sm text-primary-foreground/80 md:text-base">
              Monitor and manage users, properties, requests, and system notifications in real-time.
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ key, icon: Icon, value, label, gradient, iconColor }) => (
          <Card key={key} className="hover:scale-[1.02] transition-transform duration-200 border border-border bg-card">
            <Card.Content className="flex items-center gap-4 p-5">
              <div className={`grid size-12 place-items-center rounded-xl bg-gradient-to-br ${gradient} ${iconColor}`}>
                <Icon className="size-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold font-num text-foreground">
                  {isLoading ? (
                    <Skeleton className="h-7 w-16 rounded-lg" />
                  ) : (
                    formatNumber(value ?? 0)
                  )}
                </div>
                <div className="truncate text-sm text-muted-foreground font-medium">
                  {label}
                </div>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title={t('stats.usersByRole')} data={usersByRole} loading={isLoading} color="hsl(var(--primary))" />
        <ChartCard
          title={t('stats.propertiesByStatus')}
          data={propsByStatus}
          loading={isLoading}
          color="#10b981"
        />
        <ChartCard
          title={t('stats.requestsByStatus')}
          data={reqByStatus}
          loading={isLoading}
          color="#f59e0b"
        />
      </div>

      {/* Quick Actions & Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border border-border bg-card">
          <Card.Header className="border-b border-border/50 pb-3">
            <Card.Title className="text-lg font-bold text-foreground">Quick Actions</Card.Title>
            <Card.Description className="text-xs text-muted-foreground">Common administrative tasks</Card.Description>
          </Card.Header>
          <Card.Content className="grid gap-3 p-5">
            <Link
              to="/broadcast"
              className={buttonVariants({
                variant: 'primary',
                className: 'w-full justify-between font-medium flex items-center gap-2',
              })}
            >
              <span className="flex items-center gap-2">
                <Bell className="size-4" />
                Broadcast Notification
              </span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/users"
              className={buttonVariants({
                variant: 'secondary',
                className: 'w-full justify-between font-medium flex items-center gap-2',
              })}
            >
              <span className="flex items-center gap-2">
                <Users className="size-4" />
                Manage Users
              </span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/properties"
              className={buttonVariants({
                variant: 'tertiary',
                className: 'w-full justify-between font-medium flex items-center gap-2',
              })}
            >
              <span className="flex items-center gap-2">
                <Building2 className="size-4" />
                Review Properties
              </span>
              <ArrowRight className="size-4" />
            </Link>
          </Card.Content>
        </Card>

        {/* System Status Summary */}
        <Card className="border border-border bg-card">
          <Card.Header className="border-b border-border/50 pb-3">
            <Card.Title className="text-lg font-bold text-foreground">System Overview</Card.Title>
            <Card.Description className="text-xs text-muted-foreground">Current status of platform modules</Card.Description>
          </Card.Header>
          <Card.Content className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserCheck className="size-4 text-muted-foreground" />
                User Verification
              </div>
              <Chip color="success" variant="soft" size="sm">
                Active
              </Chip>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="size-4 text-muted-foreground" />
                Property Moderation
              </div>
              <Chip color="success" variant="soft" size="sm">
                Active
              </Chip>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Security Gateway
              </div>
              <Chip color="success" variant="soft" size="sm">
                Secure
              </Chip>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  data,
  loading,
  color,
}: {
  title: string;
  data: { name: string; value: number }[];
  loading: boolean;
  color: string;
}) {
  return (
    <Card className="border border-border bg-card">
      <Card.Header className="pb-2">
        <Card.Title className="text-base font-bold text-foreground">{title}</Card.Title>
      </Card.Header>
      <Card.Content className="p-5 pt-0">
        {loading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  color: 'hsl(var(--foreground))',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card.Content>
    </Card>
  );
}
