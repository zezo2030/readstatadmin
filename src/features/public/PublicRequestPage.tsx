import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PublicShell, StoreActions } from './PublicListingPage';
import { isAndroid, openInApp } from './openInApp';

// Request detail (`GET /property-requests/:id`) requires authentication, so the
// public page can't show the request itself — it presents a branded prompt to
// open/download the app, where the request opens via the deep link.
export function PublicRequestPage() {
  const { id = '' } = useParams();

  // Auto-open the app on load (Android): installed → the request opens, not
  // installed → Play Store. Buttons below are the fallback if it's blocked.
  useEffect(() => {
    if (id && isAndroid()) openInApp(`request/${id}`);
  }, [id]);

  return (
    <PublicShell>
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">🏠</div>
        <h1 className="text-lg font-bold">طلب عقاري على الوسيط العقاري</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          افتح التطبيق لعرض تفاصيل هذا الطلب والتواصل مع صاحبه.
        </p>
        <div className="mt-6">
          <StoreActions path={`request/${id}`} />
        </div>
      </div>
    </PublicShell>
  );
}
