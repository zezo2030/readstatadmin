import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { sendBroadcast } from '@/api/endpoints';
import { AppFailure } from '@/api/errorMapper';
import type { BroadcastAudience } from '@/api/types';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AUDIENCES: { value: BroadcastAudience; key: string }[] = [
  { value: 'all', key: 'audienceAll' },
  { value: 'regular_users', key: 'audienceRegular' },
  { value: 'brokers', key: 'audienceBrokers' },
];

const schema = z.object({
  audience: z.enum(['all', 'regular_users', 'brokers']),
  title: z.string().min(1).max(140),
  body: z.string().min(1).max(500),
});
type FormValues = z.infer<typeof schema>;

export function BroadcastPage() {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { audience: 'all', title: '', body: '' },
  });

  const audience = watch('audience');

  const mutation = useMutation({
    mutationFn: (values: FormValues) => sendBroadcast(values),
    onSuccess: () => {
      toast.success(t('broadcast.queued'));
      reset({ audience: 'all', title: '', body: '' });
    },
    onError: (err) =>
      toast.error(err instanceof AppFailure ? err.message : t('common.error')),
  });

  return (
    <div>
      <PageHeader title={t('broadcast.title')} description={t('broadcast.subtitle')} />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">{t('broadcast.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>{t('broadcast.audience')}</Label>
              <Select
                value={audience}
                onValueChange={(v) =>
                  setValue('audience', v as BroadcastAudience, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {t(`broadcast.${a.key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-title">{t('broadcast.messageTitle')}</Label>
              <Input id="b-title" maxLength={140} {...register('title')} />
              {errors.title ? (
                <p className="text-xs text-destructive">
                  {t('broadcast.messageTitle')}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-body">{t('broadcast.body')}</Label>
              <Textarea
                id="b-body"
                maxLength={500}
                className="min-h-28"
                {...register('body')}
              />
            </div>

            <Button
              type="submit"
              disabled={!isValid || mutation.isPending}
              className="w-full"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t('broadcast.sending')}
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {t('broadcast.send')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
