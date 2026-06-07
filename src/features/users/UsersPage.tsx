import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Lock, Search } from 'lucide-react';
import { listUsers, setUserStatus, approveBroker, type UsersQuery } from '@/api/endpoints';
import { AppFailure } from '@/api/errorMapper';
import type { Role, UserAdminView } from '@/api/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { RoleBadge } from '@/components/RoleBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate, formatNumber } from '@/lib/format';

const ROLES: Role[] = ['RegularUser', 'Broker', 'Admin'];
const ALL = '__all__';

export function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [role, setRole] = useState<string>(ALL);
  const [active, setActive] = useState<string>(ALL);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [target, setTarget] = useState<UserAdminView | null>(null);
  const [reason, setReason] = useState('');

  const params: UsersQuery = {
    page,
    pageSize: 20,
    role: role === ALL ? undefined : (role as Role),
    isActive: active === ALL ? undefined : active === 'true',
    q: q || undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', params],
    queryFn: () => listUsers(params),
  });

  const mutation = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean; reason?: string }) =>
      setUserStatus(vars.id, { isActive: vars.isActive, reason: vars.reason }),
    onSuccess: () => {
      toast.success(t('users.statusUpdated'));
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      setTarget(null);
      setReason('');
    },
    onError: (err) => {
      toast.error(err instanceof AppFailure ? err.message : t('common.error'));
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveBroker(id),
    onSuccess: () => {
      toast.success(t('users.brokerApproved'));
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (err) => {
      toast.error(err instanceof AppFailure ? err.message : t('common.error'));
    },
  });

  const submitSearch = () => {
    setPage(1);
    setQ(search.trim());
  };

  const columns: Column<UserAdminView>[] = [
    {
      key: 'name',
      header: t('users.name'),
      cell: (u) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{u.displayName}</div>
          <div className="truncate text-xs text-muted-foreground" dir="ltr">
            {u.email}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('users.role'),
      cell: (u) => (
        <div className="flex flex-col gap-1">
          <RoleBadge role={u.role} />
          {u.isOwner && (
            <Badge variant="default" className="gap-1 text-[10px] py-0">
              <Lock className="size-3" />
              {t('users.owner')}
            </Badge>
          )}
          {u.role === 'Broker' && (
            <Badge variant={u.isApproved ? 'outline' : 'secondary'} className="text-[10px] py-0">
              {u.isApproved ? t('users.approved') : t('users.pendingApproval')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('users.phone'),
      cell: (u) => (
        <span dir="ltr">{u.phone ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: t('users.status'),
      cell: (u) =>
        u.isActive ? (
          <Badge variant="success">{t('common.active')}</Badge>
        ) : (
          <Badge variant="secondary">{t('common.inactive')}</Badge>
        ),
    },
    {
      key: 'counts',
      header: `${t('users.properties')} / ${t('users.requests')}`,
      cell: (u) =>
        `${formatNumber(u.propertyCount ?? 0)} / ${formatNumber(u.propertyRequestCount ?? 0)}`,
    },
    {
      key: 'created',
      header: t('users.created'),
      cell: (u) => formatDate(u.createdAt),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      cell: (u) => (
        <div className="flex justify-end gap-2">
          {u.role === 'Broker' && !u.isApproved && (
            <Button
              variant="default"
              size="sm"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate(u.id)}
            >
              {t('users.approveBroker')}
            </Button>
          )}
          <Button
            variant={u.isActive ? 'outline' : 'default'}
            size="sm"
            disabled={u.role === 'Admin'}
            onClick={() => {
              setReason('');
              setTarget(u);
            }}
          >
            {u.isActive ? t('users.disable') : t('users.enable')}
          </Button>
        </div>
      ),
    },
  ];

  const disabling = target?.isActive === true;

  return (
    <div>
      <PageHeader title={t('users.title')} />

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        error={error}
        rowKey={(u) => u.id}
        pageInfo={data?.pageInfo}
        page={page}
        onPageChange={setPage}
        toolbar={
          <>
            <div className="flex items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                placeholder={t('users.searchPlaceholder')}
                className="w-64"
              />
              <Button variant="secondary" size="icon" onClick={submitSearch}>
                <Search />
              </Button>
            </div>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('users.filterRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`roles.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={active}
              onValueChange={(v) => {
                setActive(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t('users.filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                <SelectItem value="true">{t('common.active')}</SelectItem>
                <SelectItem value="false">{t('common.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <AlertDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {disabling ? t('users.disableTitle') : t('users.enableTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {disabling ? t('users.disableConfirm') : t('users.enableConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reason">
              {t('common.reason')}{' '}
              <span className="text-muted-foreground">
                ({t('common.optional')})
              </span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('users.reasonPlaceholder')}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!target) return;
                mutation.mutate({
                  id: target.id,
                  isActive: !target.isActive,
                  reason: reason.trim() || undefined,
                });
              }}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
