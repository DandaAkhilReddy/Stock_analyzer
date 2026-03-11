import type { Recommendation, TechnicalSignal } from '../../types/analysis';

type BadgeVariant = Recommendation | TechnicalSignal | 'positive' | 'negative' | 'neutral';

const variantStyles: Record<string, string> = {
  strong_buy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  buy: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  hold: 'bg-amber-50 text-amber-700 border-amber-200',
  neutral: 'bg-stone-100 text-stone-600 border-stone-200',
  sell: 'bg-orange-50 text-orange-600 border-orange-200',
  strong_sell: 'bg-red-50 text-red-600 border-red-200',
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ variant, children, size = 'sm' }: BadgeProps) {
  const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${variantStyles[variant] ?? variantStyles['neutral']} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
}
