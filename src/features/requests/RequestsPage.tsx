import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Search, Trash2 } from 'lucide-react';
import {
  deleteRequest,
  listRequests,
  updateRequest,
  updateRequestStatus,
  type RequestsQuery,
} from '@/api/endpoints';
import { AppFailure } from '@/api/errorMapper';
import type { PropertyRequest, RequestStatus } from '@/api/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { RoleBadge } from '@/components/RoleBadge';
import { StatusBadge, requestTone } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, formatPrice } from '@/lib/format';

const STATUSES: RequestStatus[] = ['open', 'in_progress', 'closed'];
const PROPERTY_TYPES = ['apartment', 'house', 'land', 'shop', 'villa', 'building'];
const REQUEST_TYPES = ['buy', 'rent'];
const CONTACT_METHODS = ['call', 'whatsapp', 'in_app'];
const ALL = '__all__';

type RequestDraft = {
  title: string;
  description: string;
  propertyType: string;
  requestType: string;
  city: string;
  area: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
  requiredRooms: string;
  approxSizeSqm: string;
  isUrgent: boolean;
  contactMethod: string;
  status: RequestStatus;
};

export function RequestsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>(ALL);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [editTarget, setEditTarget] = useState<PropertyRequest | null>(null);
  const [requestDraft, setRequestDraft] = useState<RequestDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertyRequest | null>(null);

  const params: RequestsQuery = {
    page,
    pageSize: 20,
    status: status === ALL ? undefined : (status as RequestStatus),
    search: q || undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['requests', params],
    queryFn: () => listRequests(params),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: RequestStatus }) =>
      updateRequestStatus(vars.id, vars.status),
    onSuccess: () => {
      toast.success(t('requests.statusUpdated'));
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (err) => {
      toast.error(err instanceof AppFailure ? err.message : t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRequest(id),
    onSuccess: () => {
      toast.success(t('requests.deleted'));
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err instanceof AppFailure ? err.message : t('common.error'));
    },
  });

  const submitSearch = () => {
    setPage(1);
    setQ(search.trim());
  };

  const openEdit = (request: PropertyRequest) => {
    setEditTarget(request);
    setRequestDraft({
      title: request.title,
      description: request.description,
      propertyType: request.propertyType,
      requestType: request.requestType,
      city: request.city,
      area: request.area,
      minPrice: String(request.minPrice),
      maxPrice: String(request.maxPrice),
      currency: request.currency,
      requiredRooms: String(request.requiredRooms),
      approxSizeSqm: request.approxSizeSqm == null ? '' : String(request.approxSizeSqm),
      isUrgent: request.isUrgent ?? false,
      contactMethod: request.contactMethod ?? 'in_app',
      status: request.status,
    });
  };

  const closeEdit = () => {
    setEditTarget(null);
    setRequestDraft(null);
  };

  const updateDraft = <K extends keyof RequestDraft>(
    key: K,
    value: RequestDraft[K],
  ) => {
    setRequestDraft((draft) => (draft ? { ...draft, [key]: value } : draft));
  };

  const saveMutation = useMutation({
    mutationFn: (vars: { id: string; details: RequestDraft }) =>
      updateRequest(vars.id, {
        title: vars.details.title.trim(),
        description: vars.details.description.trim(),
        propertyType: vars.details.propertyType as never,
        requestType: vars.details.requestType as never,
        city: vars.details.city.trim(),
        area: vars.details.area.trim(),
        minPrice: Number(vars.details.minPrice),
        maxPrice: Number(vars.details.maxPrice),
        currency: vars.details.currency.trim(),
        requiredRooms: Number(vars.details.requiredRooms),
        approxSizeSqm: vars.details.approxSizeSqm.trim()
          ? Number(vars.details.approxSizeSqm)
          : undefined,
        isUrgent: vars.details.isUrgent,
        contactMethod: vars.details.contactMethod as never,
        status: vars.details.status,
      }),
    onSuccess: () => {
      toast.success(t('requests.saved'));
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      closeEdit();
    },
    onError: (err) => {
      toast.error(err instanceof AppFailure ? err.message : t('common.error'));
    },
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
        <div className="flex items-center gap-2">
          <StatusBadge
            label={t(`requests.state.${r.status}`)}
            tone={requestTone(r.status)}
          />
          <Select
            value={r.status}
            onValueChange={(v) =>
              statusMutation.mutate({
                id: r.id,
                status: v as RequestStatus,
              })
            }
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`requests.state.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: 'created',
      header: t('requests.created'),
      cell: (r) => formatDate(r.createdAt),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteTarget(r)}
          >
            <Trash2 className="size-4" />
            {t('common.delete')}
          </Button>
        </div>
      ),
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
          <>
            <div className="flex items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                placeholder={t('requests.searchPlaceholder')}
                className="w-72"
              />
              <Button variant="secondary" size="icon" onClick={submitSearch}>
                <Search />
              </Button>
            </div>
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
          </>
        }
      />

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="max-w-2xl">
          {editTarget && requestDraft ? (
            <>
              <DialogHeader>
                <DialogTitle>{t('requests.editTitle')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t('requests.requestTitle')}</Label>
                  <Input
                    value={requestDraft.title}
                    onChange={(e) => updateDraft('title', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t('requests.description')}</Label>
                  <Textarea
                    value={requestDraft.description}
                    onChange={(e) => updateDraft('description', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('properties.type')}</Label>
                  <Select
                    value={requestDraft.propertyType}
                    onValueChange={(v) => updateDraft('propertyType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`properties.kind.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('requests.requestType')}</Label>
                  <Select
                    value={requestDraft.requestType}
                    onValueChange={(v) => updateDraft('requestType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`requests.kind.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('requests.city')}</Label>
                  <Input
                    value={requestDraft.city}
                    onChange={(e) => updateDraft('city', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('properties.area')}</Label>
                  <Input
                    value={requestDraft.area}
                    onChange={(e) => updateDraft('area', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('requests.minPrice')}</Label>
                  <Input
                    type="number"
                    value={requestDraft.minPrice}
                    onChange={(e) => updateDraft('minPrice', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('requests.maxPrice')}</Label>
                  <Input
                    type="number"
                    value={requestDraft.maxPrice}
                    onChange={(e) => updateDraft('maxPrice', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('properties.currency')}</Label>
                  <Input
                    value={requestDraft.currency}
                    onChange={(e) => updateDraft('currency', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('requests.requiredRooms')}</Label>
                  <Input
                    type="number"
                    value={requestDraft.requiredRooms}
                    onChange={(e) => updateDraft('requiredRooms', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('properties.size')}</Label>
                  <Input
                    type="number"
                    value={requestDraft.approxSizeSqm}
                    onChange={(e) => updateDraft('approxSizeSqm', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('requests.contactMethod')}</Label>
                  <Select
                    value={requestDraft.contactMethod}
                    onValueChange={(v) => updateDraft('contactMethod', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {t(`requests.contact.${method}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('requests.status')}</Label>
                  <Select
                    value={requestDraft.status}
                    onValueChange={(v) => updateDraft('status', v as RequestStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`requests.state.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={requestDraft.isUrgent}
                    onCheckedChange={(v) => updateDraft('isUrgent', v)}
                  />
                  <Label>{t('requests.urgent')}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeEdit}>
                  {t('common.cancel')}
                </Button>
                <Button
                  disabled={saveMutation.isPending}
                  onClick={() =>
                    saveMutation.mutate({
                      id: editTarget.id,
                      details: requestDraft,
                    })
                  }
                >
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('requests.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('requests.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
