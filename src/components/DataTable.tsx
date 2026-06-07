import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AppFailure } from '@/api/errorMapper';
import type { PageInfo } from '@/api/types';
import { formatNumber } from '@/lib/format';

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading: boolean;
  error?: unknown;
  rowKey: (row: T) => string;
  pageInfo?: PageInfo;
  page: number;
  onPageChange: (page: number) => void;
  toolbar?: ReactNode;
};

export function DataTable<T>({
  columns,
  data,
  isLoading,
  error,
  rowKey,
  pageInfo,
  page,
  onPageChange,
  toolbar,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const totalPages = pageInfo?.totalPages ?? 1;

  return (
    <div className="space-y-3">
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      ) : null}

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`s-${i}`}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-destructive"
                >
                  {error instanceof AppFailure
                    ? error.message
                    : t('common.error')}
                </TableCell>
              </TableRow>
            ) : !data || data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-muted-foreground"
                >
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {t('common.total')}: {formatNumber(pageInfo?.totalItems ?? 0)}
        </span>
        <div className="flex items-center gap-2">
          <span>
            {t('common.page')} {formatNumber(page)} {t('common.of')}{' '}
            {formatNumber(totalPages)}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            aria-label={t('common.previous')}
          >
            <ChevronRight className="hidden rtl:block" />
            <ChevronLeft className="block rtl:hidden" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            aria-label={t('common.next')}
          >
            <ChevronLeft className="hidden rtl:block" />
            <ChevronRight className="block rtl:hidden" />
          </Button>
        </div>
      </div>
    </div>
  );
}
