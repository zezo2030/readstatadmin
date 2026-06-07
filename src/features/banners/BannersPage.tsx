import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Upload } from 'lucide-react';
import {
  createBanner,
  deleteBanner,
  listBanners,
  updateBanner,
  uploadImage,
} from '@/api/endpoints';
import { AppFailure } from '@/api/errorMapper';
import type { Banner, BannerLinkType } from '@/api/types';
import { PropertyPicker } from '@/components/PropertyPicker';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { formatDate } from '@/lib/format';

const LINK_TYPES: BannerLinkType[] = ['property', 'url', 'none'];

type FormState = {
  imageObjectKey: string;
  imagePreview: string;
  title: string;
  linkType: BannerLinkType;
  propertyId: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: FormState = {
  imageObjectKey: '',
  imagePreview: '',
  title: '',
  linkType: 'none',
  propertyId: '',
  url: '',
  sortOrder: 0,
  isActive: true,
};

export function BannersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editor, setEditor] = useState<{ id: string | null; form: FormState } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<Banner | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['banners'],
    queryFn: listBanners,
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ['banners'] });

  const saveMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string | null; form: FormState }) => {
      const body = {
        imageObjectKey: form.imageObjectKey,
        title: form.title.trim() || undefined,
        linkType: form.linkType,
        propertyId: form.linkType === 'property' ? form.propertyId.trim() : undefined,
        url: form.linkType === 'url' ? form.url.trim() : undefined,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      return id ? updateBanner(id, body) : createBanner(body);
    },
    onSuccess: () => {
      toast.success(t('banners.saved'));
      invalidate();
      setEditor(null);
    },
    onError: (err) =>
      toast.error(err instanceof AppFailure ? err.message : t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      toast.success(t('banners.deleted'));
      invalidate();
      setToDelete(null);
    },
    onError: (err) =>
      toast.error(err instanceof AppFailure ? err.message : t('common.error')),
  });

  const openCreate = () => setEditor({ id: null, form: { ...emptyForm } });
  const openEdit = (b: Banner) =>
    setEditor({
      id: b.id,
      form: {
        imageObjectKey: '',
        imagePreview: b.imageUrl,
        title: b.title ?? '',
        linkType: b.linkType,
        propertyId: b.propertyId ?? '',
        url: b.url ?? '',
        sortOrder: b.sortOrder,
        isActive: b.isActive,
      },
    });

  const onPickFile = async (file: File) => {
    if (!editor) return;
    setUploading(true);
    try {
      const objectKey = await uploadImage(file);
      setEditor({
        ...editor,
        form: {
          ...editor.form,
          imageObjectKey: objectKey,
          imagePreview: URL.createObjectURL(file),
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const canSave =
    editor != null &&
    // New banners require a freshly uploaded image; edits may keep the existing one.
    (editor.id != null || editor.form.imageObjectKey !== '') &&
    (editor.form.linkType !== 'property' || editor.form.propertyId.trim() !== '') &&
    (editor.form.linkType !== 'url' || editor.form.url.trim() !== '');

  const columns: Column<Banner>[] = [
    {
      key: 'image',
      header: t('banners.image'),
      cell: (b) => (
        <img
          src={b.imageUrl}
          alt=""
          className="h-12 w-24 rounded-md border object-cover"
          loading="lazy"
        />
      ),
    },
    {
      key: 'title',
      header: t('banners.bannerTitle'),
      cell: (b) => <span className="font-medium">{b.title || '—'}</span>,
    },
    {
      key: 'link',
      header: t('banners.linkType'),
      cell: (b) => (
        <div className="flex flex-col gap-0.5">
          <span>{t(`banners.link.${b.linkType}`)}</span>
          {b.linkType === 'property' && b.propertyId ? (
            <span className="text-xs text-muted-foreground" dir="ltr">
              {b.propertyId}
            </span>
          ) : null}
          {b.linkType === 'url' && b.url ? (
            <span className="max-w-[14rem] truncate text-xs text-muted-foreground" dir="ltr">
              {b.url}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'order',
      header: t('banners.sortOrder'),
      cell: (b) => b.sortOrder,
    },
    {
      key: 'active',
      header: t('banners.status'),
      cell: (b) =>
        b.isActive ? (
          <Badge variant="success">{t('common.active')}</Badge>
        ) : (
          <Badge variant="secondary">{t('common.inactive')}</Badge>
        ),
    },
    {
      key: 'created',
      header: t('banners.created'),
      cell: (b) => formatDate(b.createdAt),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      cell: (b) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(b)}>
            {t('common.edit')}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setToDelete(b)}>
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('banners.title')}
        description={t('banners.subtitle')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t('banners.create')}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items}
        isLoading={isLoading}
        error={error}
        rowKey={(b) => b.id}
        page={1}
        onPageChange={() => {}}
      />

      {/* Create / edit dialog */}
      <Dialog open={!!editor} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="max-w-lg">
          {editor ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {editor.id ? t('banners.edit') : t('banners.create')}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Image */}
                <div className="space-y-1.5">
                  <Label>{t('banners.image')}</Label>
                  {editor.form.imagePreview ? (
                    <img
                      src={editor.form.imagePreview}
                      alt=""
                      className="h-32 w-full rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="grid h-32 w-full place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
                      {t('banners.noImage')}
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onPickFile(file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    {uploading ? t('banners.uploading') : t('banners.uploadImage')}
                  </Button>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="b-title">{t('banners.bannerTitle')}</Label>
                  <Input
                    id="b-title"
                    value={editor.form.title}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        form: { ...editor.form, title: e.target.value },
                      })
                    }
                    placeholder={t('banners.titlePlaceholder')}
                  />
                </div>

                {/* Link type */}
                <div className="space-y-1.5">
                  <Label>{t('banners.linkType')}</Label>
                  <Select
                    value={editor.form.linkType}
                    onValueChange={(v) =>
                      setEditor({
                        ...editor,
                        form: { ...editor.form, linkType: v as BannerLinkType },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINK_TYPES.map((lt) => (
                        <SelectItem key={lt} value={lt}>
                          {t(`banners.link.${lt}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editor.form.linkType === 'property' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="b-prop">{t('banners.property')}</Label>
                    <PropertyPicker
                      value={editor.form.propertyId}
                      onChange={(propertyId) =>
                        setEditor({
                          ...editor,
                          form: { ...editor.form, propertyId },
                        })
                      }
                    />
                  </div>
                ) : null}

                {editor.form.linkType === 'url' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="b-url">{t('banners.url')}</Label>
                    <Input
                      id="b-url"
                      dir="ltr"
                      value={editor.form.url}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          form: { ...editor.form, url: e.target.value },
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                ) : null}

                {/* Sort order + active */}
                <div className="flex items-end gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="b-order">{t('banners.sortOrder')}</Label>
                    <Input
                      id="b-order"
                      type="number"
                      className="w-28"
                      value={editor.form.sortOrder}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          form: {
                            ...editor.form,
                            sortOrder: Number(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <Switch
                      id="b-active"
                      checked={editor.form.isActive}
                      onCheckedChange={(v) =>
                        setEditor({
                          ...editor,
                          form: { ...editor.form, isActive: v },
                        })
                      }
                    />
                    <Label htmlFor="b-active">{t('banners.active')}</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditor(null)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  disabled={!canSave || saveMutation.isPending}
                  onClick={() =>
                    saveMutation.mutate({ id: editor.id, form: editor.form })
                  }
                >
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('banners.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('banners.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) deleteMutation.mutate(toDelete.id);
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
