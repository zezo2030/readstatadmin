import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import { listProperties } from '@/api/endpoints';
import type { Property } from '@/api/types';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';

type PropertyPickerProps = {
  value: string;
  onChange: (propertyId: string) => void;
};

export function PropertyPicker({ value, onChange }: PropertyPickerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data: selectedData } = useQuery({
    queryKey: ['properties', 'picker-selected', value],
    queryFn: () => listProperties({ id: value, pageSize: 1 }),
    enabled: value !== '',
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['properties', 'picker', debouncedSearch],
    queryFn: () =>
      listProperties({
        moderationStatus: 'active',
        pageSize: 50,
        page: 1,
        search: debouncedSearch || undefined,
      }),
    enabled: open,
  });

  const selected = selectedData?.items[0];
  const items = data?.items ?? [];

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const onSelect = (property: Property) => {
    onChange(property.id);
    setSearch('');
    setDebouncedSearch('');
    setOpen(false);
  };

  const inputValue = open ? search : (selected?.title ?? value);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id="b-prop"
          value={inputValue}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setSearch('');
            setOpen(true);
          }}
          placeholder={t('banners.propertySearchPlaceholder')}
          autoComplete="off"
        />
        <ChevronDown
          className={cn(
            'pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </div>

      {selected && !open && search === '' ? (
        <p className="text-xs text-muted-foreground" dir="ltr">
          {selected.city} · {formatPrice(selected.price, selected.currency)}
        </p>
      ) : null}

      {open ? (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {isLoading || isFetching ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {t('banners.propertyLoading')}
            </p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {t('banners.propertyNoResults')}
            </p>
          ) : (
            items.map((property) => (
              <button
                key={property.id}
                type="button"
                className={cn(
                  'flex w-full items-start gap-2 px-3 py-2 text-start text-sm hover:bg-accent hover:text-accent-foreground',
                  property.id === value && 'bg-accent/60',
                )}
                onClick={() => onSelect(property)}
              >
                <Check
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    property.id === value ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{property.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {property.city} · {formatPrice(property.price, property.currency)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
