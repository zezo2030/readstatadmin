import i18n from '@/i18n';

const locale = () => (i18n.language === 'en' ? 'en-US' : 'ar-EG');

export const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(locale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const formatNumber = (n?: number | null): string => {
  if (n === undefined || n === null) return '—';
  return new Intl.NumberFormat(locale()).format(n);
};

export const formatPrice = (
  amount?: number | null,
  currency?: string,
): string => {
  if (amount === undefined || amount === null) return '—';
  const formatted = new Intl.NumberFormat(locale(), {
    maximumFractionDigits: 0,
  }).format(amount);
  return currency ? `${formatted} ${currency}` : formatted;
};
