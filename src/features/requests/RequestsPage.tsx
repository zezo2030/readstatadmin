import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { listRequests, type RequestsQuery } from '@/api/endpoints';
import type { PropertyRequest, RequestStatus } from '@/api/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { RoleBadge } from '@/components/RoleBadge';
import { StatusBadge, requestTone } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, formatPrice } from '@/lib/format';

const STATUSES: RequestStatus[] = ['open', 'in_progress', 'closed'];
const ALL = '__all__';

export function RequestsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>(ALL);

  const params: RequestsQuery = {
    page,
    pageSize: 20,
    status: status === ALL ? undefined : (status as RequestStatus),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['requests', params],
    queryFn: () => listRequests(params),
  });

  const columns: Column<PropertyRequest>[] = [
    {
      key: 'title',
      header: t('requests.requestTitle'),
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{r.title}</span>
          {r.isUrgent ? (
            <Badge variant="destructive">{t('requests.urgent')}</Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: 'requester',
      header: t('requests.requester'),
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span className="truncate">{r.requester.displayName}</span>
          <RoleBadge role={r.requester.role} />
        </div>
      ),
    },
    {
      key: 'type',
      header: t('requests.type'),
      cell: (r) =>
        `${t(`properties.kind.${r.propertyType}`)} · ${t(`requests.kind.${r.requestType}`)}`,
    },
    {
      key: 'budget',
      header: t('requests.budget'),
      cell: (r) =>
        `${formatPrice(r.minPrice)} – ${formatPrice(r.maxPrice, r.currency)}`,
    },
    {
      key: 'city',
      header: t('requests.city'),
      cell: (r) => `${r.city}${r.area ? ` · ${r.area}` : ''}`,
    },
    {
      key: 'status',
      header: t('requests.status'),
      cell: (r) => (
        <StatusBadge
          label={t(`requests.state.${r.status}`)}
          tone={requestTone(r.status)}
        />
      ),
    },
    {
      key: 'created',
      header: t('requests.created'),
      cell: (r) => formatDate(r.createdAt),
    },
  ];

  return (
    <div>
      <PageHeader title={t('requests.title')} />
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
              <SelectValue placeholder={t('requests.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('common.all')}</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`requests.state.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
