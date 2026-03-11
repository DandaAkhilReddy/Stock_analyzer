import { motion } from 'framer-motion';
import { Newspaper, BarChart3, TrendingUp } from 'lucide-react';
import type { AnalysisTab } from '../../types/analysis';

interface TabConfig {
  id: AnalysisTab;
  label: string;
  icon: typeof Newspaper;
}

const tabs: TabConfig[] = [
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'financials', label: 'Financials', icon: BarChart3 },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
];

interface TabBarProps {
  activeTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex border-b border-white/[0.06]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
              isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={16} />
            {tab.label}

            {isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
