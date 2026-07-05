import { cn } from '@/lib/utils';

type AppLogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClass: Record<NonNullable<AppLogoProps['size']>, string> = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
};

export function AppLogo({ className, size = 'sm' }: AppLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="الوسيط العقاري"
      className={cn('shrink-0 rounded-lg object-contain', sizeClass[size], className)}
    />
  );
}
