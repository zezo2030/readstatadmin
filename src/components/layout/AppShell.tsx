import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  Users,
} from 'lucide-react';
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
] as const;

export function AppShell() {
  const { t, i18n } = useTranslation();
  const { resolvedTheme, toggle } = useTheme();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);

  const nextLang: AppLanguage = i18n.language === 'ar' ? 'en' : 'ar';

  const navLinks = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(({ to, icon: Icon, key, end }) => (
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
        </NavLink>
      ))}
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
