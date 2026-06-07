import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createArea,
  createCity,
  deleteLocation,
  listAreas,
  listCities,
  updateLocation,
} from '@/api/endpoints';
import { AppFailure } from '@/api/errorMapper';
import type { Location } from '@/api/types';
import { PageHeader } from '@/components/PageHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type DialogState =
  | { mode: 'createCity' }
  | { mode: 'createArea'; parentId: string }
  | { mode: 'edit'; location: Location }
  | null;

export function LocationsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const Chevron = i18n.dir() === 'rtl' ? ChevronLeft : ChevronRight;

  const [selectedCity, setSelectedCity] = useState<Location | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toDelete, setToDelete] = useState<Location | null>(null);

  const citiesQuery = useQuery({ queryKey: ['cities'], queryFn: listCities });
  const areasQuery = useQuery({
    queryKey: ['areas', selectedCity?.id],
    queryFn: () => listAreas(selectedCity!.id),
    enabled: !!selectedCity,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['cities'] });
    void queryClient.invalidateQueries({ queryKey: ['areas'] });
  };

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: (_data, id) => {
      toast.success(t('locations.deleted'));
      if (selectedCity?.id === id) setSelectedCity(null);
      invalidate();
      setToDelete(null);
    },
    onError: (err) =>
      toast.error(err instanceof AppFailure ? err.message : t('common.error')),
  });

  return (
    <div>
      <PageHeader
        title={t('locations.title')}
        actions={
          <Button onClick={() => setDialog({ mode: 'createCity' })}>
            <Plus className="size-4" />
            {t('locations.addCity')}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('locations.cities')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {citiesQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : citiesQuery.data?.length ? (
              citiesQuery.data.map((city) => (
                <Row
                  key={city.id}
                  active={selectedCity?.id === city.id}
                  onSelect={() => setSelectedCity(city)}
                  location={city}
                  trailing={<Chevron className="size-4 text-muted-foreground" />}
                  onEdit={() => setDialog({ mode: 'edit', location: city })}
                  onDelete={() => setToDelete(city)}
                />
              ))
            ) : (
              <Empty text={t('common.noData')} />
            )}
          </CardContent>
        </Card>

        {/* Areas of selected city */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {t('locations.areas')}
              {selectedCity ? (
                <span className="text-muted-foreground"> · {selectedCity.name}</span>
              ) : null}
            </CardTitle>
            {selectedCity ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDialog({ mode: 'createArea', parentId: selectedCity.id })
                }
              >
                <Plus className="size-4" />
                {t('locations.addArea')}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-1">
            {!selectedCity ? (
              <Empty text={t('locations.selectCity')} />
            ) : areasQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : areasQuery.data?.length ? (
              areasQuery.data.map((area) => (
                <Row
                  key={area.id}
                  location={area}
                  onEdit={() => setDialog({ mode: 'edit', location: area })}
                  onDelete={() => setToDelete(area)}
                />
              ))
            ) : (
              <Empty text={t('locations.noAreas')} />
            )}
          </CardContent>
        </Card>
      </div>

      <LocationFormDialog
        state={dialog}
        onClose={() => setDialog(null)}
        onSaved={invalidate}
      />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('locations.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('locations.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) deleteMut.mutate(toDelete.id);
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

function Row({
  location,
  active,
  onSelect,
  onEdit,
  onDelete,
  trailing,
}: {
  location: Location;
  active?: boolean;
  onSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  trailing?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
        active ? 'border-primary bg-accent/50' : 'border-transparent'
      } ${onSelect ? 'cursor-pointer hover:bg-muted/60' : ''}`}
      onClick={onSelect}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{location.name}</span>
          {location.isActive === false ? (
            <Badge variant="secondary">{t('common.inactive')}</Badge>
          ) : null}
        </div>
        <span className="font-mono text-xs text-muted-foreground" dir="ltr">
          {location.slug}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
      {trailing}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center py-8 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function LocationFormDialog({
  state,
  onClose,
  onSaved,
}: {
  state: DialogState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (state?.mode === 'edit') {
      setName(state.location.name);
      setSlug(state.location.slug ?? '');
      setIsActive(state.location.isActive);
    } else {
      setName('');
      setSlug('');
      setIsActive(true);
    }
  }, [state]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!state) return;
      if (state.mode === 'createCity') {
        await createCity({ name, slug });
      } else if (state.mode === 'createArea') {
        await createArea({ parentId: state.parentId, name, slug });
      } else {
        await updateLocation(state.location.id, { name, slug, isActive });
      }
    },
    onSuccess: () => {
      toast.success(
        state?.mode === 'edit' ? t('locations.updated') : t('locations.created'),
      );
      onSaved();
      onClose();
    },
    onError: (err) =>
      toast.error(err instanceof AppFailure ? err.message : t('common.error')),
  });

  const slugValid = SLUG_RE.test(slug);
  const canSave = name.trim().length > 0 && slugValid && !mutation.isPending;
  const title =
    state?.mode === 'edit'
      ? t('locations.editLocation')
      : state?.mode === 'createArea'
        ? t('locations.addArea')
        : t('locations.addCity');

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="loc-name">{t('locations.name')}</Label>
          <Input
            id="loc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loc-slug">{t('locations.slug')}</Label>
          <Input
            id="loc-slug"
            value={slug}
            dir="ltr"
            onChange={(e) => setSlug(e.target.value)}
          />
          <p
            className={`text-xs ${slug && !slugValid ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {t('locations.slugHint')}
          </p>
        </div>
        {state?.mode === 'edit' ? (
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Label htmlFor="loc-active">{t('common.active')}</Label>
            <Switch
              id="loc-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button disabled={!canSave} onClick={() => mutation.mutate()}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
