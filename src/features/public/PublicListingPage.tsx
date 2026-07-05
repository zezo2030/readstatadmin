import { useEffect, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { request } from '@/api/client';
import type { components } from '@/api/schema';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { isAndroid, openInApp, PLAY_STORE_URL } from './openInApp';

type Property = components['schemas']['Property'];

const propertyTypeLabel: Record<string, string> = {
  apartment: 'شقة',
  house: 'منزل',
  villa: 'فيلا',
  land: 'أرض',
  shop: 'محل',
  building: 'عمارة',
  commercial: 'تجاري',
};

export function PublicListingPage() {
  const { id = '' } = useParams();

  // Auto-open the app the moment the page loads (Android): installed → the
  // listing opens directly, not installed → Play Store (via the intent://
  // fallback). The page below is only the visible fallback if the browser
  // blocks the redirect (e.g. some in-app browsers) or on iOS/desktop.
  useEffect(() => {
    if (id && isAndroid()) openInApp(`listing/${id}`);
  }, [id]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-listing', id],
    queryFn: () => request<Property>('get', `/properties/${id}`),
    enabled: Boolean(id),
    retry: false,
  });

  return (
    <PublicShell>
      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground">جارٍ التحميل…</p>
      ) : isError || !data ? (
        <NotFound kind="listing" />
      ) : (
        <ListingBody property={data} id={id} />
      )}
    </PublicShell>
  );
}

function ListingBody({ property, id }: { property: Property; id: string }) {
  const cover = property.images?.[0]?.url;
  const dealLabel = property.listingType === 'rent' ? 'للإيجار' : 'للبيع';
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative aspect-[16/10] w-full bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={property.title}
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            لا توجد صورة
          </div>
        )}
        <span className="absolute top-3 start-3 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
          {dealLabel}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold leading-snug">{property.title}</h1>
          <p className="text-sm text-muted-foreground">
            {propertyTypeLabel[property.propertyType] ?? property.propertyType}
            {' · '}
            {property.city}
            {property.area ? ` · ${property.area}` : ''}
          </p>
        </div>

        <p className="text-2xl font-extrabold text-primary">
          {formatPrice(property.price, property.currency)}
        </p>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {property.rooms ? <span>🛏️ {property.rooms} غرف</span> : null}
          {property.bathrooms ? <span>🛁 {property.bathrooms} حمّام</span> : null}
          {property.sizeSqm ? <span>📐 {property.sizeSqm} م²</span> : null}
        </div>

        {property.description ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80 line-clamp-6">
            {property.description}
          </p>
        ) : null}

        <StoreActions path={`listing/${id}`} />
      </div>
    </div>
  );
}

function NotFound({ kind }: { kind: 'listing' | 'request' }) {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
      <p className="text-lg font-semibold">
        {kind === 'listing' ? 'هذا العقار غير متاح' : 'هذا الطلب غير متاح'}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        قد يكون قد حُذف أو لم يعد منشورًا. حمّل التطبيق لتصفّح كل العقارات.
      </p>
      <div className="mt-5">
        <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
          <Button size="lg" className="w-full">تحميل التطبيق</Button>
        </a>
      </div>
    </div>
  );
}

export function StoreActions({ path }: { path: string }) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      <Button size="lg" className="w-full" onClick={() => openInApp(path)}>
        فتح في التطبيق
      </Button>
      <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
        <Button size="lg" variant="outline" className="w-full">
          تحميل التطبيق
        </Button>
      </a>
    </div>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-muted/40 px-4 py-8">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="text-center">
          <p className="text-lg font-extrabold text-primary">الوسيط العقاري</p>
          <p className="text-xs text-muted-foreground">منصّة العقارات الأولى</p>
        </div>
        {children}
      </div>
    </div>
  );
}
