import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ImagePlus, Loader2, Search, Trash2, X } from 'lucide-react';
import {
  deleteProperty,
  listProperties,
  updateProperty,
  updatePropertyStatus,
  uploadImage,
  type PropertiesQuery,
} from '@/api/endpoints';
import { AppFailure } from '@/api/errorMapper';
import type { AvailabilityStatus, ModerationStatus, Property } from '@/api/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { RoleBadge } from '@/components/RoleBadge';
import { StatusBadge, moderationTone } from '@/components/StatusBadge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { formatDate, formatPrice } from '@/lib/format';

const STATUSES: ModerationStatus[] = ['pending_review', 'active', 'rejected'];
const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  'available',
  'reserved',
  'sold',
  'rented',
];
const PROPERTY_TYPES = [
  'apartment',
  'house',
  'land',
  'shop',
  'villa',
  'building',
  'commercial',
];
const LISTING_TYPES = ['sale', 'rent'];
const ALL = '__all__';

type PropertyImageDraft = { objectKey: string; url: string };

type PropertyDraft = {
  title: string;
  description: string;
  propertyType: string;
  listingType: string;
  price: string;
  currency: string;
  city: string;
  area: string;
  address: string;
  contactName: string;
  contactPhone: string;
  rooms: string;
  bathrooms: string;
  sizeSqm: string;
  floor: string;
};

export function PropertiesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('pending_review');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Property | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [statusDraft, setStatusDraft] = useState<ModerationStatus>('pending_review');
  const [availabilityDraft, setAvailabilityDraft] =
    useState<AvailabilityStatus>('available');
  const [propertyDraft, setPropertyDraft] = useState<PropertyDraft | null>(null);
  const [images, setImages] = useState<PropertyImageDraft[]>([]);
  const [initialImageKeys, setInitialImageKeys] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reason, setReason] = useState('');

  const params: PropertiesQuery = {
    page,
    pageSize: 20,
    moderationStatus: status === ALL ? undefined : (status as ModerationStatus),
    search: q || undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', params],
    queryFn: () => listProperties(params),
  });

  const saveMutation = useMutation({
    mutationFn: (vars: {
      id: string;
      details: PropertyDraft;
      imageObjectKeys?: string[];
      moderationStatus: ModerationStatus;
      availabilityStatus: AvailabilityStatus;
      reason?: string;
    }) => {
      const details = vars.details;
      return Promise.all([
        updateProperty(vars.id, {
          title: details.title.trim(),
          description: details.description.trim(),
          propertyType: details.propertyType as never,
          listingType: details.listingType as never,
          price: Number(details.price),
          currency: details.currency.trim(),
          city: details.city.trim(),
          area: details.area.trim(),
          address: details.address.trim() || undefined,
          contactName: details.contactName.trim(),
          contactPhone: details.contactPhone.trim(),
          rooms: Number(details.rooms),
          bathrooms: Number(details.bathrooms),
          sizeSqm: Number(details.sizeSqm),
          floor: details.floor.trim() ? Number(details.floor) : null,
          ...(vars.imageObjectKeys
            ? { imageObjectKeys: vars.imageObjectKeys }
            : {}),
        }),
        updatePropertyStatus(vars.id, {
          moderationStatus: vars.moderationStatus,
          availabilityStatus: vars.availabilityStatus,
          reason: vars.reason,
        }),
      ]);
    },
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      toast.success(t('properties.deleted'));
      void queryClient.invalidateQueries({ queryKey: ['properties'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      setDeleteTarget(null);
      if (selected?.id === deleteTarget?.id) closeDialog();
    },
    onError: (err) => {
      toast.error(err instanceof AppFailure ? err.message : t('common.error'));
    },
  });

  const openDialog = (property: Property) => {
    setSelected(property);
    setStatusDraft(property.moderationStatus);
    setAvailabilityDraft(property.availabilityStatus);
    setPropertyDraft({
      title: property.title,
      description: property.description,
      propertyType: property.propertyType,
      listingType: property.listingType,
      price: String(property.price),
      currency: property.currency,
      city: property.city,
      area: property.area,
      address: property.address ?? '',
      contactName: property.contactName ?? '',
      contactPhone: property.contactPhone ?? '',
      rooms: String(property.rooms),
      bathrooms: String(property.bathrooms),
      sizeSqm: String(property.sizeSqm),
      floor: property.floor == null ? '' : String(property.floor),
    });
    const sorted = (property.images ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({ objectKey: img.objectKey, url: img.url }));
    setImages(sorted);
    setInitialImageKeys(sorted.map((i) => i.objectKey));
    setReason(property.rejectionReason ?? '');
  };

  const closeDialog = () => {
    setSelected(null);
    setPropertyDraft(null);
    setImages([]);
    setInitialImageKeys([]);
    setReason('');
  };

  const updateDraft = (key: keyof PropertyDraft, value: string) => {
    setPropertyDraft((draft) => (draft ? { ...draft, [key]: value } : draft));
  };

  const onPickImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: PropertyImageDraft[] = [];
      for (const file of Array.from(files)) {
        const objectKey = await uploadImage(file);
        uploaded.push({ objectKey, url: URL.createObjectURL(file) });
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch {
      toast.error(t('properties.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (objectKey: string) => {
    setImages((prev) => prev.filter((img) => img.objectKey !== objectKey));
  };

  const imagesChanged =
    JSON.stringify(images.map((i) => i.objectKey)) !==
    JSON.stringify(initialImageKeys);

  const submitSearch = () => {
    setPage(1);
    setQ(search.trim());
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
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openDialog(p)}>
            {t('common.view')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteTarget(p)}
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
          <>
            <div className="flex items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                placeholder={t('properties.searchPlaceholder')}
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
          </>
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

              <div className="space-y-1.5">
                <Label>{t('properties.images')}</Label>
                <div className="flex flex-wrap gap-2">
                  {images.map((img) => (
                    <div
                      key={img.objectKey}
                      className="group relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border"
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.objectKey)}
                        className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={t('common.delete')}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="grid h-24 w-32 shrink-0 place-items-center rounded-lg border border-dashed text-muted-foreground hover:bg-accent disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-xs">
                        <ImagePlus className="size-5" />
                        {t('properties.uploadImage')}
                      </div>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => void onPickImages(e.target.files)}
                  />
                </div>
              </div>

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
                <Info label={t('properties.availability')}>
                  {t(`properties.availabilityState.${selected.availabilityStatus}`)}
                </Info>
              </div>

              {propertyDraft ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t('properties.propertyTitle')}</Label>
                    <Input
                      value={propertyDraft.title}
                      onChange={(e) => updateDraft('title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t('properties.description')}</Label>
                    <Textarea
                      value={propertyDraft.description}
                      onChange={(e) => updateDraft('description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('properties.type')}</Label>
                    <Select
                      value={propertyDraft.propertyType}
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
                    <Label>{t('properties.listingType')}</Label>
                    <Select
                      value={propertyDraft.listingType}
                      onValueChange={(v) => updateDraft('listingType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LISTING_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`properties.listing.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('properties.price')}</Label>
                    <Input
                      type="number"
                      value={propertyDraft.price}
                      onChange={(e) => updateDraft('price', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('properties.currency')}</Label>
                    <Input
                      value={propertyDraft.currency}
                      onChange={(e) => updateDraft('currency', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('properties.city')}</Label>
                    <Input
                      value={propertyDraft.city}
                      onChange={(e) => updateDraft('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('properties.area')}</Label>
                    <Input
                      value={propertyDraft.area}
                      onChange={(e) => updateDraft('area', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t('properties.address')}</Label>
                    <Input
                      value={propertyDraft.address}
                      onChange={(e) => updateDraft('address', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2 rounded-lg border border-dashed p-3">
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      {t('properties.contactSection')}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>{t('properties.contactName')}</Label>
                        <Input
                          value={propertyDraft.contactName}
                          onChange={(e) =>
                            updateDraft('contactName', e.target.value)
                          }
                          placeholder={selected.owner.displayName}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t('properties.contactPhone')}</Label>
                        <Input
                          value={propertyDraft.contactPhone}
                          onChange={(e) =>
                            updateDraft('contactPhone', e.target.value)
                          }
                          placeholder={t('properties.contactPhonePlaceholder')}
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('properties.rooms')}</Label>
                    <Input
                      type="number"
                      value={propertyDraft.rooms}
                      onChange={(e) => updateDraft('rooms', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('properties.bathrooms')}</Label>
                    <Input
                      type="number"
                      value={propertyDraft.bathrooms}
                      onChange={(e) => updateDraft('bathrooms', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('properties.size')}</Label>
                    <Input
                      type="number"
                      value={propertyDraft.sizeSqm}
                      onChange={(e) => updateDraft('sizeSqm', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('properties.floor')}</Label>
                    <Input
                      type="number"
                      value={propertyDraft.floor}
                      onChange={(e) => updateDraft('floor', e.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t('properties.status')}</Label>
                  <Select
                    value={statusDraft}
                    onValueChange={(v) => setStatusDraft(v as ModerationStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`properties.moderation.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('properties.availability')}</Label>
                  <Select
                    value={availabilityDraft}
                    onValueChange={(v) =>
                      setAvailabilityDraft(v as AvailabilityStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`properties.availabilityState.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {statusDraft === 'rejected' ? (
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
                <Button variant="outline" onClick={closeDialog}>
                  {t('common.cancel')}
                </Button>
                <Button
                  disabled={
                    saveMutation.isPending ||
                    uploading ||
                    !propertyDraft ||
                    images.length === 0 ||
                    (statusDraft === 'rejected' && !reason.trim())
                  }
                  onClick={() =>
                    propertyDraft &&
                    saveMutation.mutate({
                      id: selected.id,
                      details: propertyDraft,
                      imageObjectKeys: imagesChanged
                        ? images.map((i) => i.objectKey)
                        : undefined,
                      moderationStatus: statusDraft,
                      availabilityStatus: availabilityDraft,
                      reason: reason.trim() || undefined,
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
            <AlertDialogTitle>{t('properties.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('properties.deleteConfirm')}
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
