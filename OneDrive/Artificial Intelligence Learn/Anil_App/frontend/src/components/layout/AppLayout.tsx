import type { ReactNode } from 'react';
import { Header } from './Header';
import { useStockStore } from '../../stores/stockStore';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const currentTicker = useStockStore((s) => s.currentTicker);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <Header />
      <main className={currentTicker ? 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}>
        {children}
      </main>
    </div>
  );
}
