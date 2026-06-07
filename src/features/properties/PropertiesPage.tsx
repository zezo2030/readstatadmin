import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  listProperties,
  moderateProperty,
  type PropertiesQuery,
} from '@/api/endpoints';
import { AppFailure } from '@/api/errorMapper';
import type { ModerationStatus, Property } from '@/api/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { RoleBadge } from '@/components/RoleBadge';
import { StatusBadge, moderationTone } from '@/components/StatusBadge';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, formatPrice } from '@/lib/format';

const STATUSES: ModerationStatus[] = ['pending_review', 'active', 'rejected'];
const ALL = '__all__';

export function PropertiesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('pending_review');
  const [selected, setSelected] = useState<Property | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');

  const params: PropertiesQuery = {
    page,
    pageSize: 20,
    moderationStatus: status === ALL ? undefined : (status as ModerationStatus),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', params],
    queryFn: () => listProperties(params),
  });

  const mutation = useMutation({
    mutationFn: (vars: {
      id: string;
      action: 'approve' | 'reject';
      reason?: string;
    }) => moderateProperty(vars.id, { action: vars.action, reason: vars.reason }),
    onSuccess: () => {
      toast.success(t('properties.moderated'));
      void queryClient.invalidateQueries({ queryKey: ['properties'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      closeDialog();
    },
    onError: (err) => {
      toast.error(err instanceof AppFailure ? err.message : t('common.error'));
    },
  });

  const closeDialog = () => {
    setSelected(null);
    setRejectMode(false);
    setReason('');
  };

  const columns: Column<Property>[] = [
    {
      key: 'title',
      header: t('properties.propertyTitle'),
      cell: (p) => <span className="font-medium">{p.title}</span>,
    },
    {
      key: 'type',
      header: t('properties.type'),
      cell: (p) =>
        `${t(`properties.kind.${p.propertyType}`)} · ${t(`properties.listing.${p.listingType}`)}`,
    },
    {
      key: 'price',
      header: t('properties.price'),
      cell: (p) => formatPrice(p.price, p.currency),
    },
    {
      key: 'city',
      header: t('properties.city'),
      cell: (p) => `${p.city}${p.area ? ` · ${p.area}` : ''}`,
    },
    {
      key: 'owner',
      header: t('properties.owner'),
      cell: (p) => (
        <div className="flex items-center gap-2">
          <span className="truncate">{p.owner.displayName}</span>
          <RoleBadge role={p.owner.role} />
        </div>
      ),
    },
    {
      key: 'status',
      header: t('properties.status'),
      cell: (p) => (
        <StatusBadge
          label={t(`properties.moderation.${p.moderationStatus}`)}
          tone={moderationTone(p.moderationStatus)}
        />
      ),
    },
    {
      key: 'created',
      header: t('properties.created'),
      cell: (p) => formatDate(p.createdAt),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      cell: (p) => (
        <Button variant="outline" size="sm" onClick={() => setSelected(p)}>
          {t('common.view')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('properties.title')} />

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        error={error}
        rowKey={(p) => p.id}
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
              <SelectValue placeholder={t('properties.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('common.all')}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`properties.moderation.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {t(`properties.kind.${selected.propertyType}`)} ·{' '}
                  {t(`properties.listing.${selected.listingType}`)} ·{' '}
                  {formatPrice(selected.price, selected.currency)}
                </DialogDescription>
              </DialogHeader>

              {selected.images?.length ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selected.images
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((img) => (
                      <img
                        key={img.url}
                        src={img.url}
                        alt=""
                        className="h-32 w-44 shrink-0 rounded-lg border object-cover"
                        loading="lazy"
                      />
                    ))}
                </div>
              ) : null}

              {selected.videos?.length ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selected.videos
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((video) => (
                      <video
                        key={video.url}
                        src={video.url}
                        controls
                        preload="metadata"
                        className="h-44 w-72 shrink-0 rounded-lg border bg-black object-contain"
                      />
                    ))}
                </div>
              ) : null}

              <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">
                {selected.description}
              </p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <Info label={t('properties.city')}>
                  {selected.city} · {selected.area}
                </Info>
                <Info label={t('properties.owner')}>
                  {selected.owner.displayName}
                </Info>
                <Info label={t('properties.views')}>{selected.viewsCount}</Info>
                <Info label={t('properties.status')}>
                  <StatusBadge
                    label={t(`properties.moderation.${selected.moderationStatus}`)}
                    tone={moderationTone(selected.moderationStatus)}
                  />
                </Info>
              </div>

              {rejectMode ? (
                <div className="space-y-1.5">
                  <Label htmlFor="rej">{t('properties.rejectReasonLabel')}</Label>
                  <Textarea
                    id="rej"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('properties.rejectReasonPlaceholder')}
                  />
                </div>
              ) : null}

              <DialogFooter>
                {rejectMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setRejectMode(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={!reason.trim() || mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          id: selected.id,
                          action: 'reject',
                          reason: reason.trim(),
                        })
                      }
                    >
                      {t('properties.reject')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReason('');
                        setRejectMode(true);
                      }}
                    >
                      {t('properties.reject')}
                    </Button>
                    <Button
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({ id: selected.id, action: 'approve' })
                      }
                    >
                      {t('properties.approve')}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
