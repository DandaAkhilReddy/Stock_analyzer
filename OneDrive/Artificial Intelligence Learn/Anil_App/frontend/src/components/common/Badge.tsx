import type { Recommendation, TechnicalSignal } from '../../types/analysis';

type BadgeVariant = Recommendation | TechnicalSignal | 'positive' | 'negative' | 'neutral';

const variantStyles: Record<string, string> = {
  strong_buy: 'bg-green-500/20 text-green-400 border-green-500/30',
  buy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  hold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  sell: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  strong_sell: 'bg-red-500/20 text-red-400 border-red-500/30',
  positive: 'bg-green-500/20 text-green-400 border-green-500/30',
  negative: 'bg-red-500/20 text-red-400 border-red-500/30',
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
