import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Moon, Sun } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/auth/authStore';
import { AppFailure } from '@/api/errorMapper';
import { useTheme } from '@/lib/theme';
import { setLanguage, type AppLanguage } from '@/i18n';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { resolvedTheme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuth((s) => s.status);
  const login = useAuth((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (status === 'authenticated') {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(
        err instanceof AppFailure ? err.message : t('errors.unknown'),
      );
    }
  };

  const nextLang: AppLanguage = i18n.language === 'ar' ? 'en' : 'ar';

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-accent/40 to-background p-4">
      <div className="absolute end-4 top-4 flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setLanguage(nextLang)}>
          {nextLang === 'en' ? 'EN' : 'ع'}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="theme">
          {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 grid size-12 place-items-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
            ع
          </div>
          <CardTitle className="text-xl">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="username"
                {...register('email')}
              />
              {errors.email ? (
                <p className="text-xs text-destructive">
                  {t('login.email')} — {errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                {...register('password')}
              />
            </div>

            {serverError ? (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t('login.submitting')}
                </>
              ) : (
                t('login.submit')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
