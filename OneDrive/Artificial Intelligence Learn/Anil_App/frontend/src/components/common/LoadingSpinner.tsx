import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
}

export function LoadingSpinner({ size = 24, text }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2 text-indigo-500">
      <Loader2 size={size} className="animate-spin" />
      {text && <span className="text-sm text-stone-500">{text}</span>}
    </div>
  );
}
