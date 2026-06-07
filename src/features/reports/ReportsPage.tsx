import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { listReports, resolveReport, type ReportsQuery } from '@/api/endpoints';
import { AppFailure } from '@/api/errorMapper';
import type { Report, ReportResolveAction, ReportStatus } from '@/api/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { StatusBadge, reportTone } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';

const STATUSES: ReportStatus[] = ['open', 'resolved', 'dismissed'];
const ACTIONS: ReportResolveAction[] = [
  'none',
  'disabled_account',
  'deleted_listing',
];
const ALL = '__all__';

export function ReportsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('open');
  const [target, setTarget] = useState<Report | null>(null);
  const [outcome, setOutcome] = useState<'resolved' | 'dismissed'>('resolved');
  const [action, setAction] = useState<ReportResolveAction>('none');
  const [note, setNote] = useState('');

  const params: ReportsQuery = {
    page,
    pageSize: 20,
    status: status === ALL ? undefined : (status as ReportStatus),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', params],
    queryFn: () => listReports(params),
  });

  const mutation = useMutation({
    mutationFn: (vars: {
      id: string;
      outcome: 'resolved' | 'dismissed';
      action?: ReportResolveAction;
      note?: string;
    }) =>
      resolveReport(vars.id, {
        outcome: vars.outcome,
        action: vars.action,
        note: vars.note,
      }),
    onSuccess: () => {
      toast.success(t('reports.resolved'));
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      close();
    },
    onError: (err) => {
      toast.error(err instanceof AppFailure ? err.message : t('common.error'));
    },
  });

  const open = (r: Report) => {
    setTarget(r);
    setOutcome('resolved');
    setAction('none');
    setNote('');
  };
  const close = () => setTarget(null);

  const columns: Column<Report>[] = [
    {
      key: 'target',
      header: t('reports.target'),
      cell: (r) => (
        <div className="min-w-0">
          <div className="text-xs uppercase text-muted-foreground">
            {t(`reports.targetTypeValue.${r.targetType}`, {
              defaultValue: r.targetType,
            })}
          </div>
          <div className="truncate font-mono text-xs" dir="ltr">
            {r.targetId}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: t('reports.reason'),
      cell: (r) => (
        <span className="line-clamp-2 max-w-sm">{r.reason}</span>
      ),
    },
    {
      key: 'status',
      header: t('reports.status'),
      cell: (r) => (
        <StatusBadge
          label={t(`reports.state.${r.status}`)}
          tone={reportTone(r.status)}
        />
      ),
    },
    {
      key: 'created',
      header: t('reports.created'),
      cell: (r) => formatDate(r.createdAt),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      cell: (r) => (
        <Button
          variant="outline"
          size="sm"
          disabled={r.status !== 'open'}
          onClick={() => open(r)}
        >
          {t('reports.resolve')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('reports.title')} />

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        error={error}
        rowKey={(r) => r.id}
        pageInfo={data?.pageInfo}
        page={page}
        onPageChange={setPage}
        toolbar={
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('reports.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('common.all')}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`reports.state.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={!!target} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reports.resolveTitle')}</DialogTitle>
          </DialogHeader>

          {target ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm">
              {target.reason}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label>{t('reports.outcome')}</Label>
            <Select
              value={outcome}
              onValueChange={(v) => setOutcome(v as 'resolved' | 'dismissed')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resolved">
                  {t('reports.outcomeResolved')}
                </SelectItem>
                <SelectItem value="dismissed">
                  {t('reports.outcomeDismissed')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('reports.action')}</Label>
            <Select
              value={action}
              onValueChange={(v) => setAction(v as ReportResolveAction)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {t(
                      `reports.action${a
                        .split('_')
                        .map((s) => s[0].toUpperCase() + s.slice(1))
                        .join('')}`,
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">{t('reports.note')}</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('reports.notePlaceholder')}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={mutation.isPending}
              onClick={() => {
                if (!target) return;
                mutation.mutate({
                  id: target.id,
                  outcome,
                  action: action === 'none' ? undefined : action,
                  note: note.trim() || undefined,
                });
              }}
            >
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
