import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bell,
  Building2,
  ClipboardList,
  GalleryHorizontalEnd,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
} from 'lucide-react';
import { getPendingCount } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/auth/authStore';
import { setLanguage, type AppLanguage } from '@/i18n';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', icon: LayoutDashboard, key: 'dashboard', end: true },
  { to: '/users', icon: Users, key: 'users', end: false },
  { to: '/properties', icon: Building2, key: 'properties', end: false },
  { to: '/requests', icon: ClipboardList, key: 'requests', end: false },
  { to: '/broadcast', icon: Bell, key: 'broadcast', end: false },
  { to: '/banners', icon: GalleryHorizontalEnd, key: 'banners', end: false },
  { to: '/settings', icon: Settings, key: 'settings', end: false },
] as const;

export function AppShell() {
  const { t, i18n } = useTranslation();
  const { resolvedTheme, toggle } = useTheme();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);

  const nextLang: AppLanguage = i18n.language === 'ar' ? 'en' : 'ar';

  // Near-real-time moderation queue: drives the sidebar badges and a toast when
  // new items arrive. Polled (uncached endpoint) so the admin is alerted fast.
  const { data: pending } = useQuery({
    queryKey: ['pending-count'],
    queryFn: getPendingCount,
    refetchInterval: 15000,
  });

  const lastTotalRef = useRef<number | null>(null);
  useEffect(() => {
    if (!pending) return;
    const stored = Number(localStorage.getItem('admin.lastPending'));
    const prev =
      lastTotalRef.current ?? (Number.isFinite(stored) ? stored : null);
    if (prev !== null && pending.total > prev) {
      toast.info(t('moderation.newPending', { count: pending.total }));
    }
    lastTotalRef.current = pending.total;
    localStorage.setItem('admin.lastPending', String(pending.total));
  }, [pending, t]);

  const badgeFor = (key: string): number | undefined => {
    if (key === 'properties') return pending?.properties || undefined;
    if (key === 'requests') return pending?.requests || undefined;
    return undefined;
  };

  const navLinks = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(({ to, icon: Icon, key, end }) => {
        const badge = badgeFor(key);
        return (
          <NavLink
            key={key}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {t(`nav.${key}`)}
            {badge ? (
              <span className="ms-auto grid min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                {badge}
              </span>
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 border-e bg-card md:block">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
            ع
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">{t('app.title')}</div>
            <div className="text-xs text-muted-foreground">
              {t('app.subtitle')}
            </div>
          </div>
        </div>
        {navLinks}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 w-64 border-e bg-card">
            <div className="flex h-14 items-center gap-2 border-b px-5">
              <div className="text-sm font-bold">{t('app.title')}</div>
            </div>
            {navLinks}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="menu"
          >
            <Menu />
          </Button>
          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(nextLang)}
          >
            {nextLang === 'en' ? 'EN' : 'ع'}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="theme"
          >
            {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                  {user?.displayName?.[0] ?? '؟'}
                </span>
                <span className="hidden max-w-[10rem] truncate sm:inline">
                  {user?.displayName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">
                {user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void logout()}>
                <LogOut className="size-4" />
                {t('common.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
