import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  getSettings,
  listBlockedIdentities,
  unblockIdentity,
  updateSettings,
} from '@/api/endpoints';
import { AppFailure } from '@/api/errorMapper';
import type { AppSettings, BlockedIdentity } from '@/api/types';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, type Column } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

export function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const [form, setForm] = useState<AppSettings | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (body: AppSettings) =>
      updateSettings({
        sliderEnabled: body.sliderEnabled,
        maxListingImages: body.maxListingImages,
        maxListingVideos: body.maxListingVideos,
      }),
    onSuccess: (updated) => {
      toast.success(t('settings.saved'));
      queryClient.setQueryData(['settings'], updated);
      setForm(updated);
    },
    onError: (err) =>
      toast.error(err instanceof AppFailure ? err.message : t('common.error')),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.title')}
        description={t('settings.subtitle')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.general')}</CardTitle>
          <CardDescription>{t('settings.generalHint')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading || !form ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="slider">{t('settings.sliderEnabled')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.sliderEnabledHint')}
                  </p>
                </div>
                <Switch
                  id="slider"
                  checked={form.sliderEnabled}
                  onCheckedChange={(v) => setForm({ ...form, sliderEnabled: v })}
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="max-img">{t('settings.maxImages')}</Label>
                  <Input
                    id="max-img"
                    type="number"
                    min={1}
                    max={20}
                    className="w-28"
                    value={form.maxListingImages}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxListingImages: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-vid">{t('settings.maxVideos')}</Label>
                  <Input
                    id="max-vid"
                    type="number"
                    min={1}
                    max={1}
                    className="w-28"
                    value={form.maxListingVideos}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxListingVideos: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Button
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate(form)}
                >
                  {t('common.save')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <BlockedIdentitiesSection />
    </div>
  );
}

function BlockedIdentitiesSection() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<BlockedIdentity | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['blocked-identities'],
    queryFn: listBlockedIdentities,
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => unblockIdentity(id),
    onSuccess: () => {
      toast.success(t('blocked.unblocked'));
      void queryClient.invalidateQueries({ queryKey: ['blocked-identities'] });
      setTarget(null);
    },
    onError: (err) =>
      toast.error(err instanceof AppFailure ? err.message : t('common.error')),
  });

  const columns: Column<BlockedIdentity>[] = [
    {
      key: 'email',
      header: t('blocked.email'),
      cell: (b) => (
        <span dir="ltr">{b.email || '—'}</span>
      ),
    },
    {
      key: 'phone',
      header: t('blocked.phone'),
      cell: (b) => (
        <span dir="ltr">{b.phone || '—'}</span>
      ),
    },
    {
      key: 'reason',
      header: t('blocked.reason'),
      cell: (b) => b.reason || '—',
    },
    {
      key: 'created',
      header: t('blocked.created'),
      cell: (b) => formatDate(b.createdAt),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-end',
      cell: (b) => (
        <Button variant="outline" size="sm" onClick={() => setTarget(b)}>
          {t('blocked.unblock')}
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('blocked.title')}</CardTitle>
        <CardDescription>{t('blocked.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data?.items}
          isLoading={isLoading}
          error={error}
          rowKey={(b) => b.id}
          page={1}
          onPageChange={() => {}}
        />
      </CardContent>

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('blocked.unblockTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('blocked.unblockConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={unblockMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (target) unblockMutation.mutate(target.id);
              }}
            >
              {t('blocked.unblock')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
