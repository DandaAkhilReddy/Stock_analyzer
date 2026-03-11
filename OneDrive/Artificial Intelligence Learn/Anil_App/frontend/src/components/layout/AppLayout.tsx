import type { ReactNode } from 'react';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <Header />
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
